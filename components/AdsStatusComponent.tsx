"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";



import { Delete01Icon } from '@hugeicons-pro/core-solid-standard';
import { CancelCircleIcon } from '@hugeicons-pro/core-stroke-standard';
import { HugeiconsIcon } from '@hugeicons/react';

import { Badge } from "./ui/badge";
import { UpdateP2PAdStatus } from "@/actions/advertisements/EditAversitingStatus";
type Ad = {
    advNo: string;
    advStatus: 1 | 3 | 4;
};

export function statusBadge(advStatus: number) {
    // Ads Status: 1.online, 3.offline, 4.closed
    if (advStatus === 1) return <Badge variant="default">Online</Badge>;
    if (advStatus === 3) return <Badge variant="secondary">Offline</Badge>;

    // rojo cuando es 4 (closed)
    if (advStatus === 4) {
        return (
            <Badge className="bg-red-600 text-white hover:bg-red-600">
                Closed
            </Badge>
        );
    }

    return <Badge variant="outline">{`Status ${advStatus}`}</Badge>;
}
export function AdStatusCell({ ad }: { ad: Ad }) {
    const [isPending, startTransition] = useTransition();

    // estado local (optimistic)
    const [localStatus, setLocalStatus] = useState<Ad["advStatus"]>(ad.advStatus);

    // si el parent refresca datos, sincroniza
    useEffect(() => {
        setLocalStatus(ad.advStatus);
    }, [ad.advStatus]);

    const isOnline = useMemo(() => localStatus === 1, [localStatus]);
    const isClosed = useMemo(() => localStatus === 4, [localStatus]);

    const setStatus = (next: Ad["advStatus"]) => {
        const prev = localStatus;
        setLocalStatus(next);

        startTransition(async () => {
            const r = await UpdateP2PAdStatus({ advNos: [ad.advNo], advStatus: next });

            if (!r || (typeof r === "object" && "ok" in r && !r.ok)) {
                setLocalStatus(prev); // rollback
                console.error("Failed update status:", (r as any)?.error ?? r);
            }
        });
    };

    const toggleOnlineOffline = () => {
        if (isClosed) return;
        setStatus(isOnline ? 3 : 1);
    };

    const closeAd = () => {
        if (isClosed) return;
        setStatus(4);
    };

    return (
        <div className="flex items-center gap-3">
            {/* Badge */}
            {statusBadge(localStatus)}

            {/* Switch 1 <-> 3 */}
            <Switch
                className="cursor-pointer"
                checked={isOnline}
                onCheckedChange={toggleOnlineOffline}
                disabled={isPending || isClosed}
                aria-label={isOnline ? "Set offline" : "Set online"}
            />

            {/* Cancel/Close -> 4 */}
            <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={closeAd}
                disabled={isPending || isClosed}
                className="h-9 w-9 cursor-pointer"
                aria-label="Close ad"
                title="Close ad"
            >
                <HugeiconsIcon
                    icon={Delete01Icon}
                    size={48}
                    color="#ec1818"
                    strokeWidth={1}
                />
            </Button>
        </div>
    );
}
