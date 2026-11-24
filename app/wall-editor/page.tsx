import type { Metadata } from "next";
import { WallEditor } from "@/components/wall/WallEditor";

export const metadata: Metadata = {
  title: "Achievement wall editor",
  robots: { index: false, follow: false },
};

/** Private page for updating the framed certificates on the 3D office wall. */
export default function WallEditorPage() {
  return <WallEditor />;
}
