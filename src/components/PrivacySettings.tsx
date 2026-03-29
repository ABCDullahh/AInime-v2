import { useState } from 'react';
import {
  Eye,
  EyeOff,
  Users,
  Lock,
  Globe,
  BarChart3,
  Search,
  List,
  Activity,
  User,
  Shield,
  Check,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext';
import { toast } from '@/hooks/use-toast';
import { PrivacyLevel, PRIVACY_LABELS } from '@/types/privacy';
import { cn } from '@/lib/utils';

interface PrivacyOptionProps {
  value: PrivacyLevel;
  currentValue: PrivacyLevel;
  onSelect: (value: PrivacyLevel) => void;
  disabled?: boolean;
}

function PrivacyOption({ value, currentValue, onSelect, disabled }: PrivacyOptionProps) {
  const { label, description } = PRIVACY_LABELS[value];
  const isSelected = value === currentValue;

  const icons: Record<PrivacyLevel, React.ElementType> = {
    public: Globe,
    friends_only: Users,
    private: Lock,
  };

  const Icon = icons[value];

  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      disabled={disabled}
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border transition-all text-left w-full',
        isSelected
          ? 'border-coral bg-coral/10'
          : 'border-border hover:border-muted-foreground/50 hover:bg-secondary/50',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
          isSelected ? 'bg-coral text-white' : 'bg-secondary'
        )}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn('font-medium', isSelected && 'text-coral')}>{label}</span>
          {isSelected && <Check className="w-4 h-4 text-coral" />}
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}

interface PrivacySettingGroupProps {
  title: string;
  description: string;
  icon: React.ElementType;
  value: PrivacyLevel;
  onChange: (value: PrivacyLevel) => void;
  saving?: boolean;
}

function PrivacySettingGroup({
  title,
  description,
  icon: Icon,
  value,
  onChange,
  saving,
}: PrivacySettingGroupProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5 text-coral" />
        <div>
          <h4 className="font-medium">{title}</h4>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="grid gap-2 pl-7">
        {(['public', 'friends_only', 'private'] as PrivacyLevel[]).map((level) => (
          <PrivacyOption
            key={level}
            value={level}
            currentValue={value}
            onSelect={onChange}
            disabled={saving}
          />
        ))}
      </div>
    </div>
  );
}

export function PrivacySettings() {
  const { user, updatePrivacySettings } = useSimpleAuth();
  const [saving, setSaving] = useState<string | null>(null);

  if (!user) return null;

  const { privacy_settings } = user;

  const handlePrivacyChange = async (
    setting: 'profile_visibility' | 'list_visibility' | 'activity_visibility',
    value: PrivacyLevel
  ) => {
    setSaving(setting);
    try {
      const { error } = await updatePrivacySettings({ [setting]: value });
      if (error) throw error;
      toast({ title: 'Privacy setting updated' });
    } catch (error) {
      console.error('Failed to update privacy setting:', error);
      toast({
        title: 'Failed to update setting',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setSaving(null);
    }
  };

  const handleToggleChange = async (
    setting: 'show_stats_publicly' | 'searchable',
    value: boolean
  ) => {
    setSaving(setting);
    try {
      const { error } = await updatePrivacySettings({ [setting]: value });
      if (error) throw error;
      toast({ title: 'Privacy setting updated' });
    } catch (error) {
      console.error('Failed to update privacy setting:', error);
      toast({
        title: 'Failed to update setting',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="w-5 h-5 text-coral" />
            Privacy Settings
          </CardTitle>
          <CardDescription>
            Control who can see your profile, anime list, and activity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Profile Visibility */}
          <PrivacySettingGroup
            title="Profile Visibility"
            description="Who can view your profile page and basic information"
            icon={User}
            value={privacy_settings.profile_visibility}
            onChange={(value) => handlePrivacyChange('profile_visibility', value)}
            saving={saving === 'profile_visibility'}
          />

          {/* List Visibility */}
          <PrivacySettingGroup
            title="Anime List Visibility"
            description="Who can see your anime list and collection"
            icon={List}
            value={privacy_settings.list_visibility}
            onChange={(value) => handlePrivacyChange('list_visibility', value)}
            saving={saving === 'list_visibility'}
          />

          {/* Activity Visibility */}
          <PrivacySettingGroup
            title="Activity Visibility"
            description="Who can see your recent activity and updates"
            icon={Activity}
            value={privacy_settings.activity_visibility}
            onChange={(value) => handlePrivacyChange('activity_visibility', value)}
            saving={saving === 'activity_visibility'}
          />
        </CardContent>
      </Card>

      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Eye className="w-5 h-5 text-violet" />
            Additional Privacy Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Show Stats Publicly */}
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-teal/10 flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-4 h-4 text-teal" />
              </div>
              <div>
                <Label htmlFor="show-stats" className="font-medium">
                  Show Statistics Publicly
                </Label>
                <p className="text-sm text-muted-foreground">
                  Display your watch time, episode count, and other stats on your profile
                </p>
              </div>
            </div>
            <Switch
              id="show-stats"
              checked={privacy_settings.show_stats_publicly}
              onCheckedChange={(checked) => handleToggleChange('show_stats_publicly', checked)}
              disabled={saving === 'show_stats_publicly'}
            />
          </div>

          {/* Searchable */}
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-violet/10 flex items-center justify-center flex-shrink-0">
                <Search className="w-4 h-4 text-violet" />
              </div>
              <div>
                <Label htmlFor="searchable" className="font-medium">
                  Appear in Search Results
                </Label>
                <p className="text-sm text-muted-foreground">
                  Allow others to find your profile through search
                </p>
              </div>
            </div>
            <Switch
              id="searchable"
              checked={privacy_settings.searchable}
              onCheckedChange={(checked) => handleToggleChange('searchable', checked)}
              disabled={saving === 'searchable'}
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy Summary */}
      <Card className="glass-card border-0 border-violet/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-violet/10 flex items-center justify-center flex-shrink-0">
              <EyeOff className="w-4 h-4 text-violet" />
            </div>
            <div>
              <h4 className="font-medium mb-1">Your Privacy Summary</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>
                  Profile: <span className="text-foreground">{PRIVACY_LABELS[privacy_settings.profile_visibility].label}</span>
                </li>
                <li>
                  Anime List: <span className="text-foreground">{PRIVACY_LABELS[privacy_settings.list_visibility].label}</span>
                </li>
                <li>
                  Activity: <span className="text-foreground">{PRIVACY_LABELS[privacy_settings.activity_visibility].label}</span>
                </li>
                <li>
                  Statistics: <span className="text-foreground">{privacy_settings.show_stats_publicly ? 'Visible' : 'Hidden'}</span>
                </li>
                <li>
                  Searchable: <span className="text-foreground">{privacy_settings.searchable ? 'Yes' : 'No'}</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
