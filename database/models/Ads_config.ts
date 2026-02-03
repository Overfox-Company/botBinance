import "server-only";
import mongoose, { Schema } from "mongoose";

type OffsetMode = "above" | "below";

const SideConfigSchema = new Schema(
    {
        mode: { type: String, enum: ["above", "below"], required: true, default: "above" },
        offset: { type: Number, required: true, default: 0 },
    },
    { _id: false }
);

const BotConfigSchema = new Schema(
    {
        userId: { type: String, required: true, unique: true },
        enabled: { type: Boolean, default: false },
        buy: { type: SideConfigSchema, required: true },
        sell: { type: SideConfigSchema, required: true },
    },
    { timestamps: true }
);

export const BotConfig =
    mongoose.models.BotConfig || mongoose.model("BotConfig", BotConfigSchema);
