import { Outlet, Link, useLocation, useParams } from 'react-router-dom';
import { 
  Search, 
  History, 
  Database, 
  LineChart, 
  MessageSquare, 
  Lightbulb, 
  FileText, 
  FileOutput 
} from 'lucide-react';

export default function ProjectLayout() {
  const { id } = useParams();
  const location = useLocation();

  const tabs = [
    { name: 'Overview', href: `/dashboard/projects/${id}`, icon: Database },
    { name: 'New Search', href: `/dashboard/projects/${id}/search`, icon: Search },
    { name: 'Search History', href: `/dashboard/projects/${id}/search-history`, icon: History },
    { name: 'Scraped Content', href: `/dashboard/projects/${id}/scraped-content`, icon: Database },
    { name: 'Analysis Results', href: `/dashboard/projects/${id}/post-analysis`, icon: LineChart },
    { name: 'Visual Proposal', href: `/dashboard/projects/${id}/visual-proposal`, icon: Lightbulb },
    { name: 'Creative Brief', href: `/dashboard/projects/${id}/creative-brief`, icon: FileText },
    { name: 'Report Builder', href: `/dashboard/projects/${id}/report`, icon: FileOutput },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.href;
            return (
              <Link
                key={tab.name}
                to={tab.href}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center
                  ${isActive 
                    ? 'border-[#F5C518] text-[#F5C518]' 
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  }
                `}
              >
                <tab.icon className={`mr-2 h-4 w-4 ${isActive ? 'text-[#F5C518]' : 'text-muted-foreground'}`} />
                {tab.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="pt-4">
        <Outlet />
      </div>
    </div>
  );
}
