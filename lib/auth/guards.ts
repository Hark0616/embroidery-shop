import { getUser } from "@/lib/actions/auth";

export async function requireAdmin() {
    const user = await getUser();

    if (!user) {
        throw new Error("Unauthorized: User not authenticated");
    }

    // Check usage of 'app_metadata' for roles as per Supabase best practices
    const role = user.app_metadata?.role;

    if (role !== 'admin') {
        console.warn(`Unauthorized access attempt by user ${user.id} (${user.email})`);
        throw new Error("Forbidden: insufficient permissions");
    }

    return user;
}
