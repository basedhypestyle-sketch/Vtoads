import { Low, JSONFile } from 'lowdb';
import path from 'path';
const file = path.join(process.cwd(), '.data', 'db.json');
const adapter = new JSONFile(file);
const db = new Low(adapter);
export default async function handler(req, res) {
  await db.read();
  db.data ||= { users:{} };
  res.json(db.data);
}
