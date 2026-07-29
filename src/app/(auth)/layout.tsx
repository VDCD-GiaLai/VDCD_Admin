/**
 * Auth layout — VShop blank layout pattern.
 *
 * Uses VShop grid system (v-container, v-row, v-col) for responsive widths.
 * Full viewport height, centered content with decorative background.
 * White card always visible at every breakpoint.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative text-sm">
      <div className="v-container flex min-h-screen items-center justify-center">
        {/* ── Decorative background pattern (15% opacity like VShop blankBg) ── */}
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.15]"
          aria-hidden="true"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-body-bg to-secondary/20" />
          <div className="absolute left-1/4 top-1/4 h-[50vh] w-[50vw] rounded-full bg-primary/40 blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 h-[40vh] w-[40vw] rounded-full bg-secondary/30 blur-[100px]" />
          <div className="absolute left-1/2 top-1/2 h-[30vh] w-[30vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-info/20 blur-[80px]" />
        </div>

        {/* ── VShop grid: col-4 → col-xl-5 → col-lg-6 → col-md-8 → col-sm-10 → col-xs-12 ── */}
        <div className="v-row">
          <div className="v-col v-col-4 v-col-xl-5 v-col-lg-6 v-col-md-8 v-col-sm-10 v-col-xs-12 v-g-sm-0 mx-auto">
            <div className="my-6 w-full rounded-[5px] bg-surface shadow-[0_0_6px_rgba(0,0,0,0.06)]">
              <div className="p-6 sm:p-10 md:p-12">{children}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
