"use client";

import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import {
  BookOpen,
  TrendingUp,
  List,
  Search,
  DollarSign,
  BarChart3,
  PieChart,
  FileText,
  Newspaper,
  Calendar,
  Filter,
  GitCompare,
  ShoppingCart,
  ChevronRight,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

const categoryIcons: Record<string, React.ReactNode> = {
  Market: <TrendingUp className="size-3.5" />,
  Watchlists: <List className="size-3.5" />,
  Lookup: <Search className="size-3.5" />,
  Pricing: <DollarSign className="size-3.5" />,
  Charting: <BarChart3 className="size-3.5" />,
  Fundamentals: <PieChart className="size-3.5" />,
  Analytics: <PieChart className="size-3.5" />,
  Research: <FileText className="size-3.5" />,
  News: <Newspaper className="size-3.5" />,
  Events: <Calendar className="size-3.5" />,
  Screening: <Filter className="size-3.5" />,
  Comparison: <GitCompare className="size-3.5" />,
  "Trading (mock)": <ShoppingCart className="size-3.5" />,
};

const categoryColors: Record<string, string> = {
  Market: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  Watchlists: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  Lookup: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  Pricing: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  Charting: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  Fundamentals: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  Analytics: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  Research: "bg-teal-500/10 text-teal-500 border-teal-500/20",
  News: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  Events: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  Screening: "bg-violet-500/10 text-violet-500 border-violet-500/20",
  Comparison: "bg-lime-500/10 text-lime-500 border-lime-500/20",
  "Trading (mock)": "bg-red-500/10 text-red-500 border-red-500/20",
};

type BloombergCapability = {
  category: string;
  capability: string;
  tool: string;
  terminal: string;
  prompts: string[];
};

const bloombergCapabilities: BloombergCapability[] = [
  {
    category: "Market",
    capability: "Market snapshot (indices/sector moves/top movers)",
    tool: "mcp_bloomberg_market_snapshot",
    terminal: "WEI / IMAP / TOP",
    prompts: [
      "Show me the current market snapshot",
      "What are today's top movers?",
      "Give me an overview of the market right now",
      "How are the major indices performing today?",
    ],
  },
  {
    category: "Watchlists",
    capability: "View watchlist w/ live prices",
    tool: "mcp_bloomberg_watchlist_view",
    terminal: "WLST",
    prompts: [
      "Show me my watchlist",
      "What's the current status of my watchlist?",
      "Display watchlist with live prices",
      "Pull up my saved watchlist",
    ],
  },
  {
    category: "Watchlists",
    capability: "Create watchlist",
    tool: "mcp_bloomberg_watchlist_create",
    terminal: "WLST",
    prompts: [
      "Create a watchlist with AAPL, MSFT, and GOOGL",
      "Build a tech watchlist with the Magnificent 7 stocks",
      "Make a new watchlist for semiconductor stocks",
      "Set up a watchlist tracking EV companies",
    ],
  },
  {
    category: "Lookup",
    capability: "Security/ticker search",
    tool: "mcp_bloomberg_security_search",
    terminal: "SRCH",
    prompts: [
      "Search for Apple stock ticker",
      "Find the ticker for Tesla",
      "Look up Microsoft's stock symbol",
      "What's the ticker for Berkshire Hathaway?",
    ],
  },
  {
    category: "Pricing",
    capability: "Real-time quote",
    tool: "mcp_bloomberg_equity_quote",
    terminal: "DES / QR",
    prompts: [
      "Get me a quote for AAPL",
      "What's the current price of NVDA?",
      "Show me TSLA's real-time quote",
      "Pull up the latest quote for AMZN",
    ],
  },
  {
    category: "Pricing",
    capability: "Historical OHLCV",
    tool: "mcp_bloomberg_equity_historical",
    terminal: "GP",
    prompts: [
      "Show me AAPL's price history for the last year",
      "Get historical data for MSFT over 6 months",
      "Pull up NVDA's OHLCV data for the past quarter",
      "What was GOOGL's price movement last month?",
    ],
  },
  {
    category: "Charting",
    capability: "Interactive chart",
    tool: "mcp_bloomberg_create_chart",
    terminal: "GP / GIP",
    prompts: [
      "Create a 1-year chart for AAPL",
      "Show me a 6-month chart of NVDA",
      "Generate a YTD chart for TSLA",
      "Chart MSFT's performance over the last quarter",
    ],
  },
  {
    category: "Fundamentals",
    capability: "Key fundamentals (P/E, margins, ROE, leverage)",
    tool: "mcp_bloomberg_equity_fundamentals",
    terminal: "FA / DES",
    prompts: [
      "Show me AAPL's key fundamentals",
      "What are NVDA's P/E ratio and margins?",
      "Get the fundamental metrics for MSFT",
      "Pull up GOOGL's ROE and leverage ratios",
    ],
  },
  {
    category: "Analytics",
    capability: "Detailed ratios",
    tool: "mcp_bloomberg_analytics_ratios",
    terminal: "RV / FA",
    prompts: [
      "Show me detailed ratios for AAPL",
      "Get comprehensive ratio analysis for NVDA",
      "What are the key financial ratios for TSLA?",
      "Pull up valuation ratios for META",
    ],
  },
  {
    category: "Research",
    capability: "Integrated company research",
    tool: "mcp_bloomberg_company_research",
    terminal: "BRC / ANR / DES",
    prompts: [
      "Research NVDA: quote, chart, fundamentals, and news",
      "Give me a full research report on AAPL",
      "Deep dive into TSLA with all available data",
      "Comprehensive analysis of MSFT",
    ],
  },
  {
    category: "News",
    capability: "Company/ticker news feed",
    tool: "mcp_bloomberg_financial_news",
    terminal: "CN / TOP",
    prompts: [
      "What's the latest news on AAPL?",
      "Show me recent news for NVDA",
      "Get news headlines for Tesla",
      "Pull up the news feed for Microsoft",
    ],
  },
  {
    category: "News",
    capability: "Trending/breaking by category",
    tool: "mcp_bloomberg_trending_news",
    terminal: "TOP",
    prompts: [
      "What's trending in tech news?",
      "Show me breaking market news",
      "Get the top financial headlines today",
      "What are the trending stories in AI/semiconductors?",
    ],
  },
  {
    category: "News",
    capability: "Fetch full article content",
    tool: "mcp_bloomberg_news_article",
    terminal: "Open story",
    prompts: [
      "Read the full article about NVDA earnings",
      "Get the complete story on the Fed announcement",
      "Show me the full text of that Apple news article",
      "Pull up the detailed report on the market selloff",
    ],
  },
  {
    category: "News",
    capability: "Keyword news search",
    tool: "mcp_bloomberg_news_search",
    terminal: "NSE",
    prompts: [
      "Search news for 'AI chips'",
      "Find articles about electric vehicles",
      "Look up news on interest rate decisions",
      "Search for semiconductor shortage news",
    ],
  },
  {
    category: "Events",
    capability: "Upcoming earnings",
    tool: "mcp_bloomberg_earnings_calendar",
    terminal: "ECO",
    prompts: [
      "What earnings are coming up this week?",
      "When does NVDA report earnings?",
      "Show me the earnings calendar for tech stocks",
      "Which companies report earnings tomorrow?",
    ],
  },
  {
    category: "Screening",
    capability: "Screen equities by filters",
    tool: "mcp_bloomberg_screener",
    terminal: "EQS",
    prompts: [
      "Find undervalued tech stocks with P/E under 25",
      "Screen for large-cap growth stocks",
      "Find dividend stocks yielding over 4%",
      "Screen for profitable AI companies over $100B market cap",
    ],
  },
  {
    category: "Comparison",
    capability: "Compare 2-5 tickers on key metrics",
    tool: "mcp_bloomberg_analytics_compare",
    terminal: "RV",
    prompts: [
      "Compare AAPL, MSFT, and GOOGL",
      "Compare the Magnificent 7 stocks on key metrics",
      "How does NVDA compare to AMD and INTC?",
      "Compare TSLA vs traditional automakers",
    ],
  },
  {
    category: "Trading (mock)",
    capability: "Place order",
    tool: "mcp_bloomberg_order_place",
    terminal: "EMSX",
    prompts: [
      "Place a buy order for 100 shares of AAPL",
      "Submit a limit order for NVDA at $850",
      "Buy 50 shares of MSFT at market price",
      "Place a sell order for my TSLA position",
    ],
  },
  {
    category: "Trading (mock)",
    capability: "Order status / blotter",
    tool: "mcp_bloomberg_order_status",
    terminal: "EMSX",
    prompts: [
      "Show me my order status",
      "What's the status of my pending orders?",
      "Pull up my order blotter",
      "Check if my AAPL order was filled",
    ],
  },
];

export function GetStartedDialog() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCapability, setSelectedCapability] = useState<BloombergCapability | null>(null);
  const isNavigatingRef = useRef(false);

  const handlePromptClick = (e: React.MouseEvent, prompt: string) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Prevent double-clicks
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    
    setIsOpen(false);
    setSelectedCapability(null);
    router.push(`/?query=${encodeURIComponent(prompt)}`);
  };

  const handleBack = () => {
    setSelectedCapability(null);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      // Reset navigation guard when dialog opens
      isNavigatingRef.current = false;
    } else {
      setSelectedCapability(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="order-3 hidden bg-zinc-900 px-2 text-zinc-50 hover:bg-zinc-800 md:ml-auto md:flex md:h-fit dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200">
          <BookOpen className="size-4" />
          Get Started
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden">
        <div className="p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <TrendingUp className="size-5 text-emerald-400" />
              </div>
              Bloomberg Terminal Chat
            </DialogTitle>
            <DialogDescription className="text-base mt-2">
              Access powerful financial data and analytics through natural conversation.
              Ask questions, analyze markets, and execute trades using AI-powered Bloomberg tools.
            </DialogDescription>
          </DialogHeader>
        </div>
        <hr />
        <ScrollArea className="h-[60vh]">
          {selectedCapability ? (
            <div className="p-4">
              <div className="mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="gap-1 text-muted-foreground hover:text-foreground -ml-2 mb-3"
                >
                  <ArrowLeft className="size-4" />
                  Back to capabilities
                </Button>
                <div className="flex items-center gap-3 mb-2">
                  <Badge
                    variant="outline"
                    className={`${categoryColors[selectedCapability.category]} gap-1 font-medium`}
                  >
                    {categoryIcons[selectedCapability.category]}
                    {selectedCapability.category}
                  </Badge>
                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono text-muted-foreground">
                    {selectedCapability.tool}
                  </code>
                </div>
                <h3 className="text-lg font-semibold">{selectedCapability.capability}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Click a prompt below to start a new conversation with that request.
                </p>
              </div>

              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/50">
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Sparkles className="size-3.5" />
                        Example Prompts
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedCapability.prompts.map((prompt, index) => (
                    <TableRow
                      key={index}
                      className="border-border/30 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={(e) => handlePromptClick(e, prompt)}
                    >
                      <TableCell className="py-4">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{prompt}</span>
                          <ChevronRight className="size-4 text-muted-foreground" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-4">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Available Capabilities
                </h3>
                <p className="text-sm text-muted-foreground">
                  Click a capability to see example prompts you can try.
                </p>
              </div>

              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/50">
                    <TableHead className="w-[140px] text-xs font-semibold uppercase tracking-wider">
                      Category
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">
                      Capability
                    </TableHead>
                    <TableHead className="w-[200px] text-xs font-semibold uppercase tracking-wider hidden lg:table-cell">
                      API Tool
                    </TableHead>
                    <TableHead className="w-[120px] text-xs font-semibold uppercase tracking-wider hidden md:table-cell">
                      Terminal Equiv.
                    </TableHead>
                    <TableHead className="w-[40px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bloombergCapabilities.map((item, index) => (
                    <TableRow
                      key={index}
                      className="border-border/30 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setSelectedCapability(item)}
                    >
                      <TableCell className="py-3">
                        <Badge
                          variant="outline"
                          className={`${categoryColors[item.category]} gap-1 font-medium`}
                        >
                          {categoryIcons[item.category]}
                          {item.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 font-medium">{item.capability}</TableCell>
                      <TableCell className="py-3 hidden lg:table-cell">
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono text-muted-foreground">
                          {item.tool}
                        </code>
                      </TableCell>
                      <TableCell className="py-3 hidden md:table-cell">
                        <span className="text-xs text-muted-foreground font-mono">
                          {item.terminal}
                        </span>
                      </TableCell>
                      <TableCell className="py-3">
                        <ChevronRight className="size-4 text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
