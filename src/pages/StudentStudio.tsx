import { MessageSquare, Sparkles, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

const StudentStudio = () => {
  return (
    <div className="min-h-screen bg-background pt-14">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Student Studio</h1>
            <p className="text-sm text-muted-foreground">AI-ondersteunde leersessie</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Profiel
            </Button>
          </div>
        </div>

        {/* Main chat area placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chat Interface */}
          <div className="lg:col-span-3">
            <div className="border border-border rounded-xl bg-card h-[600px] flex flex-col">
              {/* Chat messages area */}
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <MessageSquare className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Welkom bij Student Studio
                  </h3>
                  <p className="text-muted-foreground max-w-md">
                    Start een gesprek met je AI-coach. Stel een vraag over je lesstof en ontvang begeleiding die je helpt zelf het antwoord te ontdekken.
                  </p>
                </div>
              </div>

              {/* Input area */}
              <div className="p-4 border-t border-border">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Stel je vraag..."
                    className="flex-1 bg-secondary text-foreground border border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <Button className="px-6">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Verstuur
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Tip: Wees specifiek over wat je niet begrijpt.
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar - Scaffolding Dashboard Preview */}
          <div className="lg:col-span-1">
            <div className="border border-border rounded-xl bg-card p-4">
              <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">
                10D Rubric
              </h3>
              <div className="space-y-3">
                {['K', 'C', 'P', 'TD', 'V', 'E', 'T', 'S', 'L', 'B'].map((dim) => (
                  <div key={dim} className="flex items-center justify-between">
                    <span className="text-xs font-mono text-muted-foreground">{dim}</span>
                    <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary/50 rounded-full" 
                        style={{ width: `${Math.random() * 60 + 20}%` }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Knowledge Level</span>
                  <span className="text-xs font-mono text-primary">K2</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Agency Score</span>
                  <span className="text-xs font-mono text-primary">0.72</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentStudio;
