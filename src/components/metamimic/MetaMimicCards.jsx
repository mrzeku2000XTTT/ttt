import React from "react";

const PALETTE = ["#4A90E2", "#2C3E50", "#ECF0F1", "#BDC3C7", "#71717a"];

export default function MetaMimicCards() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-[1100px]">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-[20px] border border-white/[0.08] bg-white/[0.03] p-7">
            <div
              className="mb-3.5 h-8 w-8 rounded-[10px]"
              style={{ background: "linear-gradient(135deg, #4A90E2, #2C3E50)" }}
            />
            <h3 className="mb-2 text-lg font-extrabold">Built for</h3>
            <p className="text-sm text-white/55">
              Web designers, developers, and marketers who need to convert files
              into HTML quickly without coding expertise.
            </p>
          </div>

          <div className="rounded-[20px] border border-white/[0.08] bg-white/[0.03] p-7">
            <div className="mb-3.5 h-8 w-8 rounded-[10px] bg-[#2C3E50]" />
            <h3 className="mb-2 text-lg font-extrabold">Our voice</h3>
            <p className="text-sm text-white/55">
              innovative · user-friendly · efficient · trustworthy
              <br />
              <br />
              MetaMimic's CloneHTML communicates with a tone that is innovative
              yet approachable, making complex technology accessible for everyone.
              Our voice is efficient and trustworthy, ensuring that web designers,
              developers, and marketers feel empowered to transform their images
              and files effortlessly.
            </p>
          </div>

          <div className="rounded-[20px] border border-white/[0.08] bg-white/[0.03] p-7">
            <div className="mb-3.5 h-8 w-8 rounded-[10px] bg-[#ECF0F1]" />
            <h3 className="mb-2 text-lg font-extrabold">Our palette</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {PALETTE.map((c) => (
                <span
                  key={c}
                  className="h-7 w-7 rounded-[10px] border border-white/10"
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}