import { Request, Response, NextFunction } from "express";
import admin from "firebase-admin";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

// Initialize Firebase Admin SDK
function initFirebase() {
  if (admin.apps.length > 0) return;

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (serviceAccountPath && fs.existsSync(path.resolve(serviceAccountPath))) {
    // Load from JSON file
    const serviceAccount = JSON.parse(
      fs.readFileSync(path.resolve(serviceAccountPath), "utf-8")
    );
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    // Load from individual env vars
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    });
  } else {
    console.warn(
      "Firebase Admin SDK not configured. Auth middleware will reject all requests."
    );
  }
}

initFirebase();

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email: string;
        name?: string;
        picture?: string;
      };
    }
  }
}

/**
 * Auth middleware - verifies Firebase Bearer token and upserts user in DB.
 * Rejects unauthenticated requests with 401.
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid authorization header" });
    return;
  }

  const token = authHeader.split("Bearer ")[1];

  if (!admin.apps.length) {
    res.status(500).json({ error: "Firebase Admin SDK not configured" });
    return;
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);

    req.user = {
      uid: decoded.uid,
      email: decoded.email || "",
      name: decoded.name,
      picture: decoded.picture,
    };

    // Upsert user in database
    await prisma.user.upsert({
      where: { id: decoded.uid },
      update: {
        email: decoded.email || "",
        displayName: decoded.name || null,
        avatarUrl: decoded.picture || null,
      },
      create: {
        id: decoded.uid,
        email: decoded.email || "",
        displayName: decoded.name || null,
        avatarUrl: decoded.picture || null,
      },
    });

    next();
  } catch (error) {
    console.error("Auth error:", error);
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * Optional auth middleware - same as authMiddleware but doesn't reject
 * unauthenticated requests. Sets req.user if token is valid.
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ") || !admin.apps.length) {
    next();
    return;
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    const decoded = await admin.auth().verifyIdToken(token);

    req.user = {
      uid: decoded.uid,
      email: decoded.email || "",
      name: decoded.name,
      picture: decoded.picture,
    };

    // Upsert user in database
    await prisma.user.upsert({
      where: { id: decoded.uid },
      update: {
        email: decoded.email || "",
        displayName: decoded.name || null,
        avatarUrl: decoded.picture || null,
      },
      create: {
        id: decoded.uid,
        email: decoded.email || "",
        displayName: decoded.name || null,
        avatarUrl: decoded.picture || null,
      },
    });
  } catch {
    // Token invalid — continue without user
  }

  next();
}

export { prisma };
