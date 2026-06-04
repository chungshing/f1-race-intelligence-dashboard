"use client";

import AppLayout from "@/components/AppLayout";
import TeamTable from "@/components/TeamTable";

export default function ConstructorsPage() {
    return (
        <AppLayout>
            <h1 className="text-2xl font-bold mb-6">Constructors</h1>
            <TeamTable />
        </AppLayout>
    );
}
