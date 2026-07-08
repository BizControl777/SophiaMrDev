import { db } from "./apps/backend/src/lib/db";

async function checkUsers() {
  const users = await db.user.findMany({
    select: { id: true, email: true, role: true }
  });
  console.log("Users in DB:");
  console.log(JSON.stringify(users, null, 2));
}

checkUsers()
  .catch(e => console.error(e))
  .finally(() => process.exit());
