"use server";


export type OffsetMode = "above" | "below";

export type SideConfig = {
    mode: OffsetMode;
    offset: number; // en VES
};

export type BotConfigDTO = {
    enabled: boolean;
    buy: SideConfig;
    sell: SideConfig;
    updatedAt?: number; // opcional, por conveniencia
};

export type BotConfigPatch = Partial<{
    enabled: boolean;
    buy: Partial<SideConfig>;
    sell: Partial<SideConfig>;
}>;


export type SidePatch = Partial<{
    mode: OffsetMode;
    offset: number;
}>;