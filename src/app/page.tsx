import Hero from "@/components/Hero";
import SearchCard from "@/components/SearchCard";
import WhyVoyago from "@/components/WhyVoyago";
import CityStatus from "@/components/CityStatus";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col bg-background">
      <Hero />
      <section className="flex justify-center px-6 pb-24">
        <SearchCard />
      </section>
      <WhyVoyago />
      <CityStatus />
      <Footer />
    </main>
  );
}
