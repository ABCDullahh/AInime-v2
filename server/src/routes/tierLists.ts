import { Router, Request, Response } from "express";
import { z } from "zod";
import { authMiddleware, optionalAuth, prisma } from "../middleware/auth.js";

const router = Router();

const tierItemSchema = z.object({
  animeId: z.number().int().positive(),
  animeTitle: z.string().min(1).max(255),
  animeCoverImage: z.string().max(2000).optional(),
  tier: z.enum(["S", "A", "B", "C", "D", "F"]),
  position: z.number().int().nonnegative().default(0),
});

const createTierListSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  visibility: z.enum(["public", "friends_only", "private"]).default("public"),
  items: z.array(tierItemSchema).max(100).default([]),
});

const updateTierListSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  visibility: z.enum(["public", "friends_only", "private"]).optional(),
  items: z.array(tierItemSchema).max(100).optional(),
});

/**
 * GET /api/tier-lists
 * List public tier lists (optionalAuth — shows like status if authenticated)
 */
router.get("/", optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.user) {
      const tierLists = await prisma.tierList.findMany({
        where: { visibility: "public" },
        include: {
          user: { select: { id: true, displayName: true, avatarUrl: true } },
          items: { orderBy: { position: "asc" } },
          likes: { where: { userId: req.user.uid }, select: { id: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      const result = tierLists.map((tl) => ({
        ...tl,
        isLiked: tl.likes.length > 0,
        likes: undefined,
      }));

      res.json(result);
    } else {
      const tierLists = await prisma.tierList.findMany({
        where: { visibility: "public" },
        include: {
          user: { select: { id: true, displayName: true, avatarUrl: true } },
          items: { orderBy: { position: "asc" } },
        },
        orderBy: { createdAt: "desc" },
      });

      const result = tierLists.map((tl) => ({
        ...tl,
        isLiked: false,
      }));

      res.json(result);
    }
  } catch (error) {
    console.error("Error fetching tier lists:", error);
    res.status(500).json({ error: "Failed to fetch tier lists" });
  }
});

/**
 * GET /api/tier-lists/mine
 * Get the authenticated user's tier lists
 */
router.get("/mine", authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const tierLists = await prisma.tierList.findMany({
      where: { userId: req.user!.uid },
      include: {
        items: { orderBy: { position: "asc" } },
      },
      orderBy: { updatedAt: "desc" },
    });

    res.json(tierLists);
  } catch (error) {
    console.error("Error fetching user tier lists:", error);
    res.status(500).json({ error: "Failed to fetch your tier lists" });
  }
});

/**
 * GET /api/tier-lists/:id
 * Get a single tier list with items
 */
router.get("/:id", optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    if (req.user) {
      const tierList = await prisma.tierList.findUnique({
        where: { id },
        include: {
          user: { select: { id: true, displayName: true, avatarUrl: true } },
          items: { orderBy: [{ tier: "asc" }, { position: "asc" }] },
          likes: { where: { userId: req.user.uid }, select: { id: true } },
        },
      });

      if (!tierList) {
        res.status(404).json({ error: "Tier list not found" });
        return;
      }

      // Check visibility
      if (tierList.visibility === "private" && tierList.userId !== req.user.uid) {
        res.status(403).json({ error: "This tier list is private" });
        return;
      }

      if (tierList.visibility === "friends_only" && tierList.userId !== req.user.uid) {
        const friendship = await prisma.userFriend.findFirst({
          where: {
            status: "accepted",
            OR: [
              { userId: tierList.userId, friendId: req.user.uid },
              { userId: req.user.uid, friendId: tierList.userId },
            ],
          },
        });

        if (!friendship) {
          res.status(403).json({ error: "This tier list is friends only" });
          return;
        }
      }

      res.json({
        ...tierList,
        isLiked: tierList.likes.length > 0,
        likes: undefined,
      });
    } else {
      const tierList = await prisma.tierList.findUnique({
        where: { id },
        include: {
          user: { select: { id: true, displayName: true, avatarUrl: true } },
          items: { orderBy: [{ tier: "asc" }, { position: "asc" }] },
        },
      });

      if (!tierList) {
        res.status(404).json({ error: "Tier list not found" });
        return;
      }

      if (tierList.visibility !== "public") {
        res.status(403).json({ error: "This tier list is not public" });
        return;
      }

      res.json({ ...tierList, isLiked: false });
    }
  } catch (error) {
    console.error("Error fetching tier list:", error);
    res.status(500).json({ error: "Failed to fetch tier list" });
  }
});

/**
 * POST /api/tier-lists
 * Create a new tier list with items
 * Body: { title, description?, visibility?, items: [{ animeId, animeTitle, animeCoverImage?, tier, position }] }
 */
router.post("/", authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = createTierListSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues.map((e: { message: string }) => e.message).join(", ") });
      return;
    }

    const { title, description, visibility, items } = parsed.data;

    const tierList = await prisma.tierList.create({
      data: {
        userId: req.user!.uid,
        title,
        description: description || null,
        visibility,
        items: {
          create: items.map((item) => ({
            animeId: item.animeId,
            animeTitle: item.animeTitle,
            animeCoverImage: item.animeCoverImage || null,
            tier: item.tier,
            position: item.position,
          })),
        },
      },
      include: { items: true },
    });

    res.status(201).json(tierList);
  } catch (error) {
    console.error("Error creating tier list:", error);
    res.status(500).json({ error: "Failed to create tier list" });
  }
});

/**
 * PUT /api/tier-lists/:id
 * Update a tier list (owner only)
 * Body: { title?, description?, visibility?, items?: [...] }
 */
router.put("/:id", authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const existing = await prisma.tierList.findUnique({
      where: { id },
    });

    if (!existing) {
      res.status(404).json({ error: "Tier list not found" });
      return;
    }

    if (existing.userId !== req.user!.uid) {
      res.status(403).json({ error: "You can only edit your own tier lists" });
      return;
    }

    const parsed = updateTierListSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues.map((e: { message: string }) => e.message).join(", ") });
      return;
    }

    const { title, description, visibility, items } = parsed.data;

    // If items are provided, replace all items
    if (items) {
      await prisma.tierListItem.deleteMany({
        where: { tierListId: id },
      });
    }

    const tierList = await prisma.tierList.update({
      where: { id },
      data: {
        title: title ?? existing.title,
        description: description !== undefined ? description : existing.description,
        visibility: visibility ?? existing.visibility,
        ...(items
          ? {
              items: {
                create: items.map((item) => ({
                  animeId: item.animeId,
                  animeTitle: item.animeTitle,
                  animeCoverImage: item.animeCoverImage || null,
                  tier: item.tier,
                  position: item.position,
                })),
              },
            }
          : {}),
      },
      include: { items: true },
    });

    res.json(tierList);
  } catch (error) {
    console.error("Error updating tier list:", error);
    res.status(500).json({ error: "Failed to update tier list" });
  }
});

/**
 * DELETE /api/tier-lists/:id
 * Delete a tier list (owner only)
 */
router.delete("/:id", authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const existing = await prisma.tierList.findUnique({
      where: { id },
    });

    if (!existing) {
      res.status(404).json({ error: "Tier list not found" });
      return;
    }

    if (existing.userId !== req.user!.uid) {
      res.status(403).json({ error: "You can only delete your own tier lists" });
      return;
    }

    await prisma.tierList.delete({
      where: { id },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting tier list:", error);
    res.status(500).json({ error: "Failed to delete tier list" });
  }
});

/**
 * POST /api/tier-lists/:id/like
 * Toggle like on a tier list
 */
router.post("/:id/like", authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const tierListId = req.params.id as string;
    const userId = req.user!.uid;

    const existing = await prisma.tierList.findUnique({
      where: { id: tierListId },
    });

    if (!existing) {
      res.status(404).json({ error: "Tier list not found" });
      return;
    }

    // Check if already liked
    const existingLike = await prisma.tierListLike.findUnique({
      where: {
        tierListId_userId: { tierListId, userId },
      },
    });

    if (existingLike) {
      // Unlike
      await prisma.tierListLike.delete({
        where: { id: existingLike.id },
      });

      await prisma.tierList.update({
        where: { id: tierListId },
        data: { likesCount: { decrement: 1 } },
      });

      res.json({ liked: false, likesCount: existing.likesCount - 1 });
    } else {
      // Like
      await prisma.tierListLike.create({
        data: { tierListId, userId },
      });

      await prisma.tierList.update({
        where: { id: tierListId },
        data: { likesCount: { increment: 1 } },
      });

      res.json({ liked: true, likesCount: existing.likesCount + 1 });
    }
  } catch (error) {
    console.error("Error toggling like:", error);
    res.status(500).json({ error: "Failed to toggle like" });
  }
});

export default router;
