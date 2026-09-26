import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "삼국 영지 · 인연으로 쓰는 천하", description: "나만의 군주와 영지를 만들고 장수를 모집해 부대를 이끄는 삼국지 전략 게임" };
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
