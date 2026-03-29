import { Router, Request, Response } from "express";
import { z } from "zod";
import { authMiddleware, prisma } from "../middleware/auth.js";

const router = Router();

const upsertSchema = z.object({
  animeId: z.number().int().positive(),
  status: z.enum(["SAVED", "LOVED", "WATCHING", "WATCHED", "DROPPED"]),
  rating: z.number().int().min(1).max(10).optional(),
  notes: z.string().max(2000).optional(),
});

const progressSchema = z.object({
  lastEpisodeWatched: z.number().int().nonnegative().max(10000),
});

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /api/anime-list
 * Get the authenticated user's anime list
 */
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const entries = await prisma.userAnimeList.findMany({
      where: { userId: req.user!.uid },
      orderBy: { updatedAt: "desc" },
    });

    res.json(entries);
  } catch (error) {
    console.error("Error fetching anime list:", error);
    res.status(500).json({ error: "Failed to fetch anime list" });
  }
});

/**
 * PUT /api/anime-list
 * Upsert an anime list entry
 * Body: { animeId: number, status: string, rating?: number, notes?: string }
 */
router.put("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = upsertSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues.map((e: { message: string }) => e.message).join(", ") });
      return;
    }

    const { animeId, status, rating, notes } = parsed.data;

    const entry = await prisma.userAnimeList.upsert({
      where: {
        userId_animeId: {
          userId: req.user!.uid,
          animeId: Number(animeId),
        },
      },
      update: {
        status,
        rating: rating ?? null,
        notes: notes ?? null,
      },
      create: {
        userId: req.user!.uid,
        animeId: Number(animeId),
        status,
        rating: rating ?? null,
        notes: notes ?? null,
      },
    });

    res.json(entry);
  } catch (error) {
    console.error("Error upserting anime list entry:", error);
    res.status(500).json({ error: "Failed to update anime list" });
  }
});

/**
 * PATCH /api/anime-list/:animeId/progress
 * Update lastEpisodeWatched for an anime
 * Body: { lastEpisodeWatched: number }
 */
router.patch(
  "/:animeId/progress",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const animeId = Number(req.params.animeId);
      const parsed = progressSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues.map((e: { message: string }) => e.message).join(", ") });
        return;
      }

      const { lastEpisodeWatched } = parsed.data;

      // Check if entry exists
      const existing = await prisma.userAnimeList.findUnique({
        where: {
          userId_animeId: {
            userId: req.user!.uid,
            animeId,
          },
        },
      });

      if (!existing) {
        res.status(404).json({ error: "Anime not found in your list" });
        return;
      }

      const entry = await prisma.userAnimeList.update({
        where: {
          userId_animeId: {
            userId: req.user!.uid,
            animeId,
          },
        },
        data: { lastEpisodeWatched: Number(lastEpisodeWatched) },
      });

      res.json(entry);
    } catch (error) {
      console.error("Error updating progress:", error);
      res.status(500).json({ error: "Failed to update progress" });
    }
  }
);

/**
 * DELETE /api/anime-list/:animeId
 * Remove an anime from the user's list
 */
router.delete(
  "/:animeId",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const animeId = Number(req.params.animeId);

      const existing = await prisma.userAnimeList.findUnique({
        where: {
          userId_animeId: {
            userId: req.user!.uid,
            animeId,
          },
        },
      });

      if (!existing) {
        res.status(404).json({ error: "Anime not found in your list" });
        return;
      }

      await prisma.userAnimeList.delete({
        where: {
          userId_animeId: {
            userId: req.user!.uid,
            animeId,
          },
        },
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting anime list entry:", error);
      res.status(500).json({ error: "Failed to remove anime from list" });
    }
  }
);

export default router;
