import { Router, Request, Response } from "express";
import { readCollection, writeCollection, getNextId } from "../lib/storage.js";
import bcrypt from "bcryptjs";

type User = {
  id: number;
  nama: string;
  username: string;
  password: string;
  role: string;
  komisariat: string | null;
  aktif: boolean;
  createdAt: string;
  updatedAt: string;
};

const router = Router();

router.get("/", (_req: Request, res: Response) => {
  const users = readCollection<User>("users");
  const admins = users
    .filter((u) => u.role === "admin")
    .map(({ password: _, ...rest }) => rest);
  res.json(admins);
});

router.post("/", async (req: Request, res: Response) => {
  const body = req.body;
  const users = readCollection<User>("users");

  if (users.find((u) => u.username === body.username)) {
    res.status(400).json({ error: "Username sudah terdaftar" });
    return;
  }

  const hashedPassword = await bcrypt.hash(body.password || "admin123", 10);

  const newUser: User = {
    id: getNextId("users"),
    nama: body.nama,
    username: body.username,
    password: hashedPassword,
    role: "admin",
    komisariat: body.komisariat || null,
    aktif: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  users.push(newUser);
  writeCollection("users", users);

  const { password: _, ...userWithoutPassword } = newUser;
  res.status(201).json(userWithoutPassword);
});

router.put("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const body = req.body;
  const users = readCollection<User>("users");
  const index = users.findIndex((u) => u.id === Number(id));

  if (index === -1) {
    res.status(404).json({ error: "Tidak ditemukan" });
    return;
  }

  if (body.password) {
    body.password = await bcrypt.hash(body.password, 10);
  } else {
    delete body.password;
  }

  users[index] = {
    ...users[index],
    ...body,
    id: users[index].id,
    role: users[index].role,
    updatedAt: new Date().toISOString(),
  };

  writeCollection("users", users);

  const { password: _, ...userWithoutPassword } = users[index];
  res.json(userWithoutPassword);
});

router.delete("/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const users = readCollection<User>("users");
  const user = users.find((u) => u.id === Number(id));

  if (!user) {
    res.status(404).json({ error: "Tidak ditemukan" });
    return;
  }

  if (user.role === "superadmin") {
    res.status(403).json({ error: "Tidak bisa menghapus superadmin" });
    return;
  }

  const filtered = users.filter((u) => u.id !== Number(id));
  writeCollection("users", filtered);
  res.json({ success: true });
});

export default router;
