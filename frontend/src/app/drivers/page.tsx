"use client";

import AppLayout from "@/components/layout/AppLayout";
import DriverTable from "@/components/DriverTable";

export default function DriversPage() {
    return (
        <AppLayout>
            <h1 className="text-2xl font-bold mb-6">Drivers</h1>
            <DriverTable />
        </AppLayout>
    );
}
