import Image from 'next/image';
import Link from 'next/link';

export function Landing() {
  return (
    <div
      data-design="page"
      className="mx-auto flex h-svh min-h-svh max-w-[1800px] flex-col px-[clamp(24px,5vw,80px)] py-[clamp(24px,3.5vw,56px)] mobile:px-6 mobile:pt-5 mobile:pb-4 short-desktop:pt-[22px] short-desktop:pb-5 compact:h-auto"
    >
      <header data-design="header" className="flex items-center justify-between gap-5">
        <a
          data-design="brand"
          className="flex items-center gap-3 text-[22px] font-[750] tracking-[-0.7px] [-webkit-tap-highlight-color:transparent] focus-visible:outline-3 focus-visible:outline-offset-5 focus-visible:outline-ink mobile:gap-2 mobile:text-[18px]"
          href="/"
          aria-label="itch dashboard home"
        >
          <span>
            itch<span className="font-[450]"> dashboard</span>
          </span>
        </a>
        <span className="text-[13px] font-medium tablet:hidden">Your creative work, closer.</span>
      </header>
      <main
        data-design="hero"
        className="mx-auto grid min-h-0 w-full max-w-[1320px] flex-1 grid-cols-[1fr_1.1fr] items-center gap-[clamp(36px,5vw,72px)] wide:gap-[72px] tablet:grid-cols-[1fr_1.05fr] tablet:gap-8 mobile:flex mobile:flex-col mobile:justify-center mobile:gap-5 mobile:text-center short-mobile:gap-3 compact:py-6"
      >
        <div data-design="copy" className="pb-2.5 mobile:p-0">
          <h1 className="mb-7 text-[clamp(54px,6.4vw,92px)] leading-[1.04] font-[600] tracking-[-0.055em] tablet:text-[clamp(44px,6.6vw,64px)] mobile:mb-4 mobile:text-[clamp(40px,10.8vw,54px)] short-desktop:mb-5 short-desktop:text-[clamp(46px,6vw,76px)] short-mobile:text-[38px]">
            <span className="flex items-center gap-[0.2em] mobile:justify-center">
              Your
              <a
                href="https://itch.io"
                aria-label="itch.io"
                className="inline-flex origin-center items-center rounded-sm focus-visible:outline-3 focus-visible:outline-offset-5 focus-visible:outline-ink motion-safe:hover:animate-logo-wiggle motion-safe:focus-visible:animate-logo-wiggle"
              >
                <Image
                  src="/itch-wordmark.logo.svg"
                  alt="itch.io"
                  width={195}
                  height={50}
                  className="h-[0.68em] w-auto"
                />
              </a>
            </span>
            companion.
          </h1>
          <p
            data-design="description"
            className="max-w-[350px] text-[18px] leading-[1.65] font-[450] tracking-[-0.2px] tablet:text-[16px] mobile:mx-auto mobile:max-w-[290px] mobile:text-[14px] mobile:leading-[1.55] short-mobile:text-[13px]"
          >
            Keep up with your sales and the creators around you. Wherever you take your phone.
          </p>
          <div
            data-design="availability"
            className="mt-9 flex flex-col gap-3 mobile:mt-4 short-desktop:mt-[22px] short-mobile:mt-2.5"
          >
            <p className="text-[11px] mobile:text-[10px]">The companion app for iOS & Android</p>
            <div className="flex items-center gap-6 mobile:justify-center mobile:gap-5">
              <Image
                src="/app-store.badge.svg"
                alt="Download on the App Store"
                width={120}
                height={40}
                className="h-11 w-auto mobile:h-10"
              />
              <Image
                src="/google-play.badge.svg"
                alt="Get it on Google Play"
                width={239}
                height={71}
                className="h-11 w-auto mobile:h-10"
              />
            </div>
          </div>
        </div>
        <div
          data-design="showcase"
          className="relative flex min-h-0 w-full items-center justify-center [container-type:inline-size] mobile:max-w-[280px]"
        >
          <div className="relative h-[min(70svh,145cqw,740px)] w-full max-w-[570px] tablet:h-[min(62svh,145cqw)] mobile:h-[clamp(250px,38svh,360px)] short-desktop:h-[min(70svh,145cqw)] short-mobile:h-[34svh]">
            <div className="relative aspect-[1206/2622] bg-[#151515] p-[7px] shadow-[0_0_0_1px_#555,0_0_0_3px_#252525,0_0_0_4px_#c8a5a0,18px_28px_48px_#67212b38,3px_9px_12px_#67212b30] [border-radius:15%/7%] before:absolute before:top-[22%] before:left-[-6px] before:h-[12%] before:w-[3px] before:rounded-[3px] before:bg-[#242424] before:content-[''] after:absolute after:top-[29%] after:right-[-6px] after:h-[10%] after:w-[3px] after:rounded-[3px] after:bg-[#242424] after:content-[''] mobile:p-[5px] absolute! top-0 right-[2%] h-[86%] rotate-[6deg] motion-reduce:rotate-0">
              <div className="relative h-full overflow-hidden bg-[#101010] [border-radius:13%/6%]">
                <Image
                  src="/creators.screen.png"
                  alt="The itch dashboard Creators tab showing creator profiles and revenue"
                  width={1206}
                  height={2622}
                  className="h-full w-full object-cover"
                  sizes="(max-width: 600px) 160px, (max-width: 900px) 230px, 300px"
                  priority
                />
              </div>
            </div>
            <div className="relative aspect-[1206/2622] bg-[#151515] p-[7px] shadow-[0_0_0_1px_#555,0_0_0_3px_#252525,0_0_0_4px_#c8a5a0,18px_28px_48px_#67212b38,3px_9px_12px_#67212b30] [border-radius:15%/7%] before:absolute before:top-[22%] before:left-[-6px] before:h-[12%] before:w-[3px] before:rounded-[3px] before:bg-[#242424] before:content-[''] after:absolute after:top-[29%] after:right-[-6px] after:h-[10%] after:w-[3px] after:rounded-[3px] after:bg-[#242424] after:content-[''] mobile:p-[5px] absolute! bottom-[-2%] left-[3%] z-10 h-[92%] rotate-[-5deg] motion-reduce:rotate-0">
              <div className="relative h-full overflow-hidden bg-[#101010] [border-radius:13%/6%]">
                <Image
                  src="/dashboard.screen.png"
                  alt="The itch dashboard Home tab showing revenue, payments, and customer statistics"
                  width={1206}
                  height={2622}
                  className="h-full w-full object-cover"
                  sizes="(max-width: 600px) 160px, (max-width: 900px) 230px, 300px"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </main>
      <footer className="flex flex-col items-center gap-2 pt-4 text-[11px] leading-[1.5] tracking-[0.1px] opacity-80 contrast-more:opacity-100 mobile:pt-3 mobile:text-[9px]">
        <span className="max-w-[720px] text-center">
          itch dashboard is an independent project and is not affiliated with, endorsed by, or
          sponsored by itch.io or Itch Corp. The itch.io name and logo are the property of Itch
          Corp.
        </span>
        <nav aria-label="Legal" className="flex gap-4">
          <Link href="/legal/terms" className="underline underline-offset-4">
            Terms and Conditions
          </Link>
          <Link href="/legal/privacy" className="underline underline-offset-4">
            Privacy Policy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
