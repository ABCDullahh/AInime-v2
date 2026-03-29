import { Router, Request, Response } from "express";
import { z } from "zod";
import { authMiddleware, prisma } from "../middleware/auth.js";

const router = Router();

const updateSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  profileVisibility: z.enum(["public", "friends_only", "private"]).optional(),
  listVisibility: z.enum(["public", "friends_only", "private"]).optional(),
  activityVisibility: z.enum(["public", "friends_only", "private"]).optional(),
  showStatsPublicly: z.boolean().optional(),
  searchable: z.boolean().optional(),
});

/**
 * PATCH /api/users/me
 * Update current user's profile and privacy settings
 * Body: { displayName?, profileVisibility?, listVisibility?, activityVisibility?, showStatsPublicly?, searchable? }
 */
router.patch(
  "/me",
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const parsed = updateSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues.map((e: { message: string }) => e.message).join(", ") });
        return;
      }

      const {
        displayName,
        profileVisibility,
        listVisibility,
        activityVisibility,
        showStatsPublicly,
        searchable,
      } = parsed.data;

      const data: Record<string, unknown> = {};
      if (displayName !== undefined) data.displayName = displayName;
      if (profileVisibility !== undefined) data.profileVisibility = profileVisibility;
      if (listVisibility !== undefined) data.listVisibility = listVisibility;
      if (activityVisibility !== undefined) data.activityVisibility = activityVisibility;
      if (showStatsPublicly !== undefined) data.showStatsPublicly = showStatsPublicly;
      if (searchable !== undefined) data.searchable = searchable;

      const user = await prisma.user.update({
        where: { id: req.user!.uid },
        data,
        select: {
          id: true,
          email: true,
          displayName: true,
          avatarUrl: true,
          profileVisibility: true,
          listVisibility: true,
          activityVisibility: true,
          showStatsPublicly: true,
          searchable: true,
        },
      });

      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  }
);

/**
 * GET /api/users/:id/privacy
 * Get a user's privacy settings (public endpoint)
 */
router.get(
  "/:id/privacy",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;

      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          profileVisibility: true,
          listVisibility: true,
          activityVisibility: true,
          showStatsPublicly: true,
          searchable: true,
        },
      });

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.json(user);
    } catch (error) {
      console.error("Error fetching user privacy:", error);
      res.status(500).json({ error: "Failed to fetch user privacy settings" });
    }
  }
);

export default router;
