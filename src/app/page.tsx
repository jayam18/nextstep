import SearchDashboard from '@/components/SearchDashboard';
import collegesData from '@/data/colleges.json';

export default async function Home() {
  // Fetch initial curated colleges (default fallback before client geolocation loads)
  const colleges = collegesData as any[];
  const initialColleges = colleges
    .filter(c => c.acceptanceRate > 0)
    .sort((a, b) => a.acceptanceRate - b.acceptanceRate)
    .slice(0, 6);

  return (
    <div className="min-h-screen">
      <SearchDashboard initialColleges={initialColleges} />
    </div>
  );
}
