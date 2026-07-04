import { revalidatePath } from "next/cache";

export function revalidateAppPath(path: string) {
  try {
    revalidatePath(path);
  } catch (error) {
    if (process.env.NODE_ENV === "test" && error instanceof Error && error.message.includes("static generation store missing")) {
      return;
    }
    throw error;
  }
}
