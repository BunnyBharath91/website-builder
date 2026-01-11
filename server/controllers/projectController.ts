import { Request, Response } from "express";
import openai from "../configs/openai.js";
import prisma from "../lib/prisma.js";

// Controller function to make revision
export const makeRevision = async (req: Request, res: Response) => {
  const userId = req.userId;

  try {
    const { projectId } = req.params;
    const { message } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized user" });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!userId || !user) {
      return res.status(401).json({ message: "Unauthorized user" });
    }

    if (user.credits < 5) {
      return res
        .status(403)
        .json({ message: "Add more credits to make changes" });
    }

    if (!message || message.trim() === "") {
      return res.status(400).json({ message: "Please enter a valid prompt" });
    }

    const currentProject = await prisma.websiteProject.findUnique({
      where: {
        id: projectId,
      },
      include: {
        versions: true,
      },
    });

    if (!currentProject) {
      return res.status(404).json({ message: "Project not found" });
    }

    await prisma.conversation.create({
      data: {
        role: "user",
        content: message,
        projectId: projectId,
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        credits: { decrement: 5 },
      },
    });

    // Enhance user prompt
    const promptEnhancedResponse = await openai.chat.completions.create({
      model: process.env.MODEL || "tngtech/deepseek-r1t2-chimera:freeS",
      messages: [
        {
          role: "system",
          content: `
          You are a prompt enhancement specialist. Take the user's website request and expand it into a detailed, comprehensive prompt that will help create the best possible website.

          Enhance this prompt by:
          1. Adding specific design details (layout, color scheme, typography)
          2. Specifying key sections and features
          3. Describing the user experience and interactions
          4. Including modern web design best practices
          5. Mentioning responsive design requirements
          6. Adding any missing but important elements

          Return ONLY the enhanced prompt, nothing else. Make it detailed but concise (2-3 paragraphs max).
          `,
        },
        {
          role: "user",
          content: `User's request: "${message}"`,
        },
      ],
    });

    const enhancedPrompt = promptEnhancedResponse.choices[0].message.content;

    await prisma.conversation.create({
      data: {
        role: "assistant",
        content: `I've enhanced your prompt to: "${enhancedPrompt}"`,
        projectId: projectId,
      },
    });

    await prisma.conversation.create({
      data: {
        role: "assistant",
        content: "Now making changes to your website...",
        projectId: projectId,
      },
    });

    // Generate website code
    const codeGenerationResponse = await openai.chat.completions.create({
      model: process.env.MODEL || "tngtech/deepseek-r1t2-chimera:freeS",
      messages: [
        {
          role: "system",
          content: `
          You are an expert web developer. Create a complete, production-ready, single-page website based on this request: "${enhancedPrompt}"

          CRITICAL REQUIREMENTS:
          - You MUST output valid HTML ONLY. 
          - Use Tailwind CSS for ALL styling
          - Include this EXACT script in the <head>: <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
          - Use Tailwind utility classes extensively for styling, animations, and responsiveness
          - Make it fully functional and interactive with JavaScript in <script> tag before closing </body>
          - Use modern, beautiful design with great UX using Tailwind classes
          - Make it responsive using Tailwind responsive classes (sm:, md:, lg:, xl:)
          - Use Tailwind animations and transitions (animate-*, transition-*)
          - Include all necessary meta tags
          - Use Google Fonts CDN if needed for custom fonts
          - Use placeholder images from https://placehold.co/600x400
          - Use Tailwind gradient classes for beautiful backgrounds
          - Make sure all buttons, cards, and components use Tailwind styling

          CRITICAL HARD RULES:
          1. You MUST put ALL output ONLY into message.content.
          2. You MUST NOT place anything in "reasoning", "analysis", "reasoning_details", or any hidden fields.
          3. You MUST NOT include internal thoughts, explanations, analysis, comments, or markdown.
          4. Do NOT include markdown, explanations, notes, or code fences.

          The HTML should be complete and ready to render as-is with Tailwind CSS.
          `,
        },
        {
          role: "user",
          content: `
          Here is the current website code: "${currentProject.current_code}"
          The user wants this change: "${enhancedPrompt}"`,
        },
      ],
    });

    const code = codeGenerationResponse.choices[0].message.content || "";

    if (!code) {
      await prisma.conversation.create({
        data: {
          role: "assistant",
          content: "I'm sorry, but I was unable to generate the website code.",
          projectId,
        },
      });

      await prisma.user.update({
        where: { id: userId },
        data: { credits: { increment: 5 } },
      });

      return;
    }

    const version = await prisma.version.create({
      data: {
        code: code
          .replace(/```[a-z]*\n?/g, "")
          .replace(/```/g, "")
          .trim(),
        description: "changes made",
        projectId,
      },
    });

    await prisma.conversation.create({
      data: {
        role: "assistant",
        content:
          "I've made changes to your website! Now you can now preview it",
        projectId,
      },
    });

    await prisma.websiteProject.update({
      where: {
        id: projectId,
      },
      data: {
        current_code: code
          .replace(/```[a-z]*\n?/g, "")
          .replace(/```/g, "")
          .trim(),
        current_version_index: version.id,
      },
    });

    res.json({
      message: "Changes made successfully",
    });
  } catch (error: any) {
    await prisma.user.update({
      where: { id: userId },
      data: { credits: { increment: 5 } },
    });
    console.log(error.code || error.message);
    res.status(500).json({ message: error.message });
  }
};

// Controller function to rollback to previous version
export const rollbackToVersion = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized user" });
    }

    const { projectId, versionId } = req.params;

    const project = await prisma.websiteProject.findUnique({
      where: {
        id: projectId,
        userId,
      },
      include: {
        versions: true,
      },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const version = project.versions.find(
      (version) => version.id === versionId
    );

    if (!version) {
      return res.status(404).json({ message: "Version not found" });
    }

    await prisma.websiteProject.update({
      where: {
        id: projectId,
        userId,
      },
      data: {
        current_code: version.code,
        current_version_index: version.id,
      },
    });

    await prisma.conversation.create({
      data: {
        role: "assistant",
        content: "I've rolled back to the previous version of your website!",
        projectId,
      },
    });

    res.json({ message: "version rolled back" });
  } catch (error: any) {
    console.log(error.code || error.message);
    res.status(500).json({ message: error.message });
  }
};

// Controller function to delete a project
export const deleteProject = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { projectId } = req.params;

    await prisma.websiteProject.delete({
      where: {
        id: projectId,
        userId,
      },
    });

    res.json({ message: "Project deleted successfully" });
  } catch (error: any) {
    console.log(error.code || error.message);
    res.status(500).json({ message: error.message });
  }
};

// Controller for getting project code for preview
export const getProjectPreview = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { projectId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized user" });
    }

    const project = await prisma.websiteProject.findFirst({
      where: {
        id: projectId,
        userId,
      },
      include: {
        versions: true,
      },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json({ project });
  } catch (error: any) {
    console.log(error.code || error.message);
    res.status(500).json({ message: error.message });
  }
};

// Get published projects
export const getPublishedProjects = async (req: Request, res: Response) => {
  try {
    const projects = await prisma.websiteProject.findMany({
      where: {
        isPublished: true,
      },
      include: {
        user: true,
      },
    });
    res.json({ projects });
  } catch (error: any) {
    console.log(error.code || error.message);
    res.status(500).json({ message: error.message });
  }
};

// Get a single project by id
export const getProjectById = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const project = await prisma.websiteProject.findFirst({
      where: {
        id: projectId,
      },
    });

    if (!project || !project.isPublished || !project?.current_code) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json({ code: project.current_code });
  } catch (error: any) {
    console.log(error.code || error.message);
    res.status(500).json({ message: error.message });
  }
};

// Controller to save project
export const saveProjectCode = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { projectId } = req.params;
    const { code } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized user" });
    }

    if (!code) {
      return res.status(400).json({ message: "No code provided" });
    }

    const project = await prisma.websiteProject.findUnique({
      where: {
        id: projectId,
        userId,
      },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    await prisma.websiteProject.update({
      where: {
        id: projectId,
      },
      data: {
        current_code: code,
        current_version_index: "",
      },
    });

    res.json({ message: "Project saved successfully" });
  } catch (error: any) {
    console.log(error.code || error.message);
    res.status(500).json({ message: error.message });
  }
};
