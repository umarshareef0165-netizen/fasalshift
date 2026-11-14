import fs from 'node:fs';
import path from 'node:path';
import Planner from '@/components/Planner';
import type { DistrictsCache } from '@/lib/fasalshift-types';

// Read at request time (not build time): the district cache is generated
// during the sprint by the data layer and may appear after the first build.
// A missing or malformed cache renders honest "not yet computed" states —
// never invented numbers.
export const dynamic = 'force-dynamic';

function loadCache(): DistrictsCache | null {
  try {
    const file = path.join(process.cwd(), 'data', 'districts.json');
    const raw = fs.readFileSync(file, 'utf-8');
    const parsed: unknown = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !('districts' in parsed) ||
      typeof (parsed as { districts: unknown }).districts !== 'object'
    ) {
      return null;
    }
    return parsed as DistrictsCache;
  } catch {
    return null;
  }
}

export default function Home() {
  return <Planner cache={loadCache()} />;
}
