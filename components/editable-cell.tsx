"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { UpdateP2PAdParams } from "@/actions/advertisements/UpdateP2PAdParams";
import { useRouter } from "next/navigation";

type Field = "price" | "initAmount" | "minSingleTransAmount" | "maxSingleTransAmount";

type Props = {
    advNo: string;
    field: Field;

    // Lo que se muestra (formateado)
    display: string;

    // Valor raw editable (string/number)
    raw: string;

    className?: string;
    inputClassName?: string;

    // Validación opcional (serializable)
    min?: number;
    max?: number;
    decimals?: number; // no obligatorio, solo para UX
};

function toNumberString(raw: string) {
    // quita separadores, soporta "1.234,56" -> "1234.56"
    return raw.replace(/\s/g, "").replace(/\./g, "").replace(/,/g, ".");
}

function isValidNumberString(raw: string) {
    if (!raw) return false;
    const n = Number(raw);
    return !Number.isNaN(n) && Number.isFinite(n);
}

export function EditableNumberCell({
    advNo,
    field,
    display,
    raw,
    className,
    inputClassName,
    min,
    max,
}: Props) {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(raw);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const ref = useRef<HTMLInputElement | null>(null);
    const router = useRouter();

    useEffect(() => {
        if (!editing) {
            setValue(raw);
            setError(null);
        }
    }, [raw, editing]);

    useEffect(() => {
        if (editing) {
            queueMicrotask(() => ref.current?.focus());
            queueMicrotask(() => ref.current?.select());
        }
    }, [editing]);

    const commit = () => {
        const normalized = toNumberString(value);

        if (!isValidNumberString(normalized)) {
            setError("Número inválido");
            return;
        }

        const n = Number(normalized);

        if (min !== undefined && n < min) {
            setError(`Debe ser >= ${min}`);
            return;
        }
        if (max !== undefined && n > max) {
            setError(`Debe ser <= ${max}`);
            return;
        }

        // si no cambió, cerrar
        if (normalized === toNumberString(raw)) {
            setEditing(false);
            return;
        }

        setError(null);

        startTransition(async () => {
            const payload: any = { advNo };
            payload[field] = normalized;

            const r = await UpdateP2PAdParams(payload);
            //    console.log("UPDATE RESULT:", r);
            if (!r) {
                setError("No se pudo guardar");
                return;
            }
            router.refresh();

            setEditing(false);
        });
    };

    const cancel = () => {
        setEditing(false);
        setValue(raw);
        setError(null);
    };

    if (!editing) {
        return (
            <div
                className={cn("cursor-text select-none", className)}
                onDoubleClick={() => setEditing(true)}
                title="Doble click para editar"
            >
                {display}
            </div>
        );
    }

    return (
        <div className={cn("space-y-1", className)}>
            <Input
                ref={ref}
                value={value}
                disabled={isPending}
                className={cn("h-8", inputClassName, error ? "border-red-500 focus-visible:ring-red-500" : "")}
                onChange={(e) => setValue(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => {
                    if (e.key === "Enter") commit();
                    if (e.key === "Escape") cancel();
                }}
            />
            {error ? <div className="text-[11px] text-red-500">{error}</div> : null}
        </div>
    );
}
