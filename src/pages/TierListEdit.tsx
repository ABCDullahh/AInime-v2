import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { Header } from '@/components/Header';
import { SectionHeader } from '@/components/SectionHeader';
import { TierListCreator } from '@/components/tier-list';
import { Button } from '@/components/ui/button';
import { useTierListDetail } from '@/hooks/useTierList';

export default function TierListEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: tierList, isLoading, error } = useTierListDetail(id);

  const handleSaved = () => {
    navigate(`/tier-lists/${id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-coral" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !tierList) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <div className="flex flex-col items-center justify-center py-20">
            <AlertCircle className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Tier list not found</h2>
            <p className="text-muted-foreground mb-6">
              This tier list may have been deleted or is not accessible.
            </p>
            <Link to="/tier-lists">
              <Button variant="coral">Browse Tier Lists</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        <div className="mb-6">
          <Link to={`/tier-lists/${id}`}>
            <Button variant="ghost" size="sm" className="gap-2 mb-4">
              <ArrowLeft className="w-4 h-4" />
              Back to Tier List
            </Button>
          </Link>

          <SectionHeader
            title="Edit Tier List"
            subtitle="Update your anime rankings"
          />
        </div>

        <div className="max-w-4xl">
          <TierListCreator
            tierListId={id}
            initialTitle={tierList.title}
            initialDescription={tierList.description || ''}
            initialVisibility={tierList.visibility}
            initialItems={tierList.items || []}
            onSaved={handleSaved}
          />
        </div>
      </main>
    </div>
  );
}
