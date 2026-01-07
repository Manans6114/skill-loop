import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCreditBalance } from "@/hooks/useApi";
import { LogOut, User, MessageCircle, Coins } from "lucide-react";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { data: creditData } = useCreditBalance();
  
  const isActive = (path: string) => location.pathname === path || 
    (path === '/dashboard' && location.pathname === '/');

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo Section */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">SL</span>
          </div>
          <button 
            onClick={() => navigate('/dashboard')}
            className="font-semibold text-xl bg-gradient-primary bg-clip-text text-transparent hover:opacity-80 transition-opacity"
          >
            SkillLoop
          </button>
        </div>

        {/* Navigation Section */}
        <div className="flex items-center space-x-8">
          <nav className="hidden md:flex space-x-8">
            <button 
              onClick={() => navigate('/dashboard')}
              className={`text-sm font-medium transition-colors px-3 py-2 rounded-lg ${
                isActive('/dashboard') 
                  ? 'text-indigo bg-indigo/10' 
                  : 'text-foreground/70 hover:text-foreground hover:bg-muted/50'
              }`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => navigate('/matches')}
              className={`text-sm font-medium transition-colors px-3 py-2 rounded-lg ${
                isActive('/matches') 
                  ? 'text-indigo bg-indigo/10' 
                  : 'text-foreground/70 hover:text-foreground hover:bg-muted/50'
              }`}
            >
              Matches
            </button>
            <button 
              onClick={() => navigate('/sessions')}
              className={`text-sm font-medium transition-colors px-3 py-2 rounded-lg ${
                isActive('/sessions') 
                  ? 'text-indigo bg-indigo/10' 
                  : 'text-foreground/70 hover:text-foreground hover:bg-muted/50'
              }`}
            >
              Sessions
            </button>
            <button 
              onClick={() => navigate('/profile')}
              className={`text-sm font-medium transition-colors px-3 py-2 rounded-lg ${
                isActive('/profile') 
                  ? 'text-indigo bg-indigo/10' 
                  : 'text-foreground/70 hover:text-foreground hover:bg-muted/50'
              }`}
            >
              Profile
            </button>
            <button 
              onClick={() => navigate('/community')}
              className={`text-sm font-medium transition-colors px-3 py-2 rounded-lg ${
                isActive('/community') 
                  ? 'text-indigo bg-indigo/10' 
                  : 'text-foreground/70 hover:text-foreground hover:bg-muted/50'
              }`}
            >
              Community
            </button>
            <button 
              onClick={() => navigate('/chat')}
              className={`text-sm font-medium transition-colors px-3 py-2 rounded-lg flex items-center gap-1 ${
                isActive('/chat') 
                  ? 'text-indigo bg-indigo/10' 
                  : 'text-foreground/70 hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              Chat
            </button>
          </nav>

          {/* Credits Badge */}
          <div className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-indigo/10 rounded-full">
            <Coins className="w-4 h-4 text-indigo" />
            <span className="text-sm font-medium text-indigo">
              {creditData?.credits ?? user?.credits ?? 0}
            </span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatar || ''} alt={user?.name || 'User'} />
                  <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium">{user?.name || 'User'}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <User className="mr-2 h-4 w-4" />
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/chat')}>
                <MessageCircle className="mr-2 h-4 w-4" />
                Messages
              </DropdownMenuItem>
              <DropdownMenuItem className="sm:hidden">
                <Coins className="mr-2 h-4 w-4" />
                Credits: {creditData?.credits ?? user?.credits ?? 0}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
