import HeroSection from "@/components/hero-section";
import FlashDeals from "@/components/flash-deals";
import FeaturedCategories from "@/components/featured-categories";
import TryAtHomeFeature from "@/components/try-at-home-feature";
import Testimonials from "@/components/testimonials";
import HomeRecommendations from "@/components/home-recommendations";
export default function Home() {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <div className="py-4 flex flex-col gap-6">
        <FlashDeals />
        <FeaturedCategories />
        <TryAtHomeFeature />
        <Testimonials />
        {/* ML-based recommendations */}
        <HomeRecommendations />
      </div>
    </div>
  );
}
