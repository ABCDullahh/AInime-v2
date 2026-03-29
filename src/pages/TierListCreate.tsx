import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Header } from '@/components/Header';
import { SectionHeader } from '@/components/SectionHeader';
import { TierListCreator } from '@/components/tier-list';
import { Button } from '@/components/ui/button';
import { TIER_LIST_TEMPLATES } from '@/types/tierList';
import { Link } from 'react-router-dom';

export default function TierListCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('template');

  const template = templateId
    ? TIER_LIST_TEMPLATES.find((t) => t.id === templateId)
    : null;

  const handleSaved = (id: string) => {
    navigate(`/tier-lists/${id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        <div className="mb-6">
          <Link to="/tier-lists">
            <Button variant="ghost" size="sm" className="gap-2 mb-4">
              <ArrowLeft className="w-4 h-4" />
              Back to Tier Lists
            </Button>
          </Link>

          <SectionHeader
            title={template ? `Create: ${template.name}` : 'Create Tier List'}
            subtitle={template?.description || 'Drag and drop anime to rank them'}
          />
        </div>

        <div className="max-w-4xl">
          <TierListCreator
            initialTitle={template?.name || ''}
            templateId={templateId || undefined}
            onSaved={handleSaved}
          />
        </div>
      </main>
    </div>
  );
}
