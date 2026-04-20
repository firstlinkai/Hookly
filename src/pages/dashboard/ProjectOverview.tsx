import { useParams } from 'react-router-dom';

export default function ProjectOverview() {
  const { id } = useParams();
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">Project Overview</h1>
      <p className="text-gray-500">Project ID: {id}</p>
    </div>
  );
}
