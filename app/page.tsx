import Hero from "@/sections/Hero";
import PopularTransfers from "@/sections/PopularTransfers";
import Experience from "@/sections/Experience";
import Testimonials from "@/sections/Testimonials";
import Footer from "@/sections/Footer";
import OurTeam from "@/sections/ourteam";
import FloatingContactButtons from "@/components/FloatingContactButtons";

export default function Home() {
  return (
    <>
      <Hero />
      <PopularTransfers />
      <Experience />
      <OurTeam />
      <Testimonials />
      <FloatingContactButtons />
      <Footer />
    </>
  );
}

