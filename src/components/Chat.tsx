import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Brain, 
  Upload, 
  BookOpen, 
  Briefcase, 
  Users, 
  Clock, 
  Sparkles, 
  ArrowRight 
} from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant' | 'system' | 'agent';
  content: string;
  timestamp: Date;
  model?: string;
  analysis?: AnalysisResult[];
  selectedPathway?: string;
  agentType?: string;
}

interface AnalysisResult {
  category: 'ancestry' | 'business' | 'education' | 'personal' | 'time' | 'growth';
  title: string;
  summary: string;
  recommendations: string[];
  pathways?: string[];
}

interface ChatProps {
  userName?: string;
  ancestry?: string;
  businessGoals?: string;
}

export const Chat: React.FC<ChatProps> = ({ 
  userName = 'User', 
  ancestry = 'European and Asian heritage',
  businessGoals = 'Automate marketing and preserve cultural knowledge'
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentModel, setCurrentModel] = useState<string>('auto');
  const [streamingContent, setStreamingContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initialAnalysis = generatePersonalizedPlan(ancestry, businessGoals);
    const initialMessage: Message = {
      role: 'system',
      content: 'Welcome to Genesis Heritage Pro! I\'ve prepared some personalized insights based on your profile:',
      timestamp: new Date(),
      analysis: initialAnalysis
    };
    setMessages([initialMessage]);
  }, [ancestry, businessGoals]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const loadingMessage: Message = {
      role: 'system',
      content: `Analyzing your family tree data from ${file.name}...`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, loadingMessage]);

    setIsLoading(true);
    
    // Simulate file analysis
    setTimeout(() => {
      setMessages(prev => prev.filter(msg => msg !== loadingMessage));
      
      const analysisMessage: Message = {
        role: 'system',
        content: `I've analyzed your family tree data from ${file.name}. Here's what I found:`,
        timestamp: new Date(),
        analysis: [
          {
            category: 'ancestry',
            title: 'Family Heritage Analysis',
            summary: 'Based on your genealogical data, I\'ve identified key patterns and cultural significance.',
            recommendations: [
              'Document family stories and traditions',
              'Connect with relatives who share similar heritage',
              'Explore cultural practices that can benefit your business approach'
            ],
            pathways: [
              'Oral History Collection',
              'Cultural Tradition Documentation',
              'Family Business Legacy Analysis'
            ]
          },
          {
            category: 'business',
            title: 'Heritage-Based Business Insights',
            summary: 'Your family history reveals potential business opportunities and strengths.',
            recommendations: [
              'Incorporate cultural values into business practices',
              'Leverage traditional knowledge for innovation',
              'Build networks within your cultural community'
            ],
            pathways: [
              'Cultural Market Analysis',
              'Traditional Business Methods Integration',
              'Community Network Building'
            ]
          }
        ]
      };
      
      setMessages(prev => [...prev, analysisMessage]);
      setIsLoading(false);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }, 2000);
  };

  const handlePathwayClick = (pathway: string, category: string) => {
    const userMessage: Message = {
      role: 'user',
      content: `I'd like to explore the ${pathway} pathway`,
      timestamp: new Date(),
      selectedPathway: pathway
    };

    const agentMessage: Message = {
      role: 'agent',
      content: `👋 Hello ${userName}, I'm your ${pathway} specialist.`,
      timestamp: new Date(),
      agentType: pathway
    };

    setMessages(prev => [...prev, userMessage, agentMessage]);
    setIsLoading(true);
    setStreamingContent('');

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        role: 'assistant',
        content: generatePathwayResponse(pathway, ancestry, businessGoals),
        timestamp: new Date(),
        model: currentModel,
        selectedPathway: pathway
      };

      setMessages(prev => [...prev, assistantMessage]);
      setStreamingContent('');
      setIsLoading(false);
    }, 2000);
  };

  const handleOptionClick = (option: string) => {
    const userMessage: Message = {
      role: 'user',
      content: option,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setStreamingContent('');

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        role: 'assistant',
        content: generateOptionResponse(option, userName, ancestry, businessGoals),
        timestamp: new Date(),
        model: currentModel
      };

      setMessages(prev => [...prev, assistantMessage]);
      setStreamingContent('');
      setIsLoading(false);
    }, 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setStreamingContent('');

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        role: 'assistant',
        content: generateResponse(input, userName, ancestry, businessGoals),
        timestamp: new Date(),
        model: currentModel
      };

      setMessages(prev => [...prev, assistantMessage]);
      setStreamingContent('');
      setIsLoading(false);
    }, 2000);
  };

  const renderAnalysis = (analysis: AnalysisResult[]) => (
    <div className="space-y-4 mt-2">
      {analysis.map((result, index) => (
        <div 
          key={index} 
          className={cn(
            "bg-blue-50 p-4 rounded-lg transition-all duration-200",
            selectedCategory === result.category
              ? "ring-2 ring-blue-500"
              : "hover:bg-blue-100 cursor-pointer"
          )}
          onClick={() => setSelectedCategory(
            selectedCategory === result.category ? null : result.category
          )}
        >
          <div className="flex items-center space-x-2">
            {result.category === 'time' && <Clock className="w-5 h-5 text-blue-600" />}
            {result.category === 'growth' && <Sparkles className="w-5 h-5 text-blue-600" />}
            {result.category === 'ancestry' && <BookOpen className="w-5 h-5 text-blue-600" />}
            {result.category === 'business' && <Briefcase className="w-5 h-5 text-blue-600" />}
            <h3 className="font-semibold text-blue-900">{result.title}</h3>
          </div>
          
          <p className="text-blue-800 mt-2">{result.summary}</p>
          
          <div className="mt-4 space-y-4">
            {selectedCategory === result.category && result.pathways && (
              <div className="bg-white rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-gray-900">Available Pathways:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {result.pathways.map((pathway, idx) => (
                    <button
                      key={idx}
                      className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePathwayClick(pathway, result.title);
                      }}
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span>{pathway}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="space-y-1">
              <h4 className="font-medium text-gray-900">Recommendations:</h4>
              {result.recommendations.map((rec, idx) => (
                <button
                  key={idx}
                  className="w-full text-left px-3 py-2 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOptionClick(`Help me with: ${rec}`);
                  }}
                >
                  {rec}
                </button>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const getMessageIcon = (message: Message) => {
    if (message.role === 'agent') {
      return <Bot className="w-6 h-6 text-blue-500" />;
    }
    return message.role === 'user' ? 
      <User className="w-6 h-6 text-gray-500" /> : 
      <Brain className="w-6 h-6 text-blue-500" />;
  };

  const availableModels = [
    { id: 'auto', name: 'Auto-Select', description: 'Best model for your task' },
    { id: 'gpt-4', name: 'GPT-4', description: 'Advanced reasoning' },
    { id: 'claude-3-opus', name: 'Claude 3 Opus', description: 'Nuanced understanding' },
    { id: 'gemini-pro', name: 'Gemini Pro', description: 'Fast responses' }
  ];

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-xl shadow-sm border border-blue-100">
      <div className="flex items-center justify-between p-4 border-b border-blue-100">
        <div className="flex items-center space-x-2">
          <Brain className="w-6 h-6 text-blue-500" />
          <span className="font-semibold">Genesis AI Assistant Pro</span>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-2 px-4 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
            disabled={isLoading}
          >
            <Upload className="w-4 h-4" />
            <span>Upload Family Tree (CSV)</span>
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div key={index}>
            <div className={cn(
              "flex items-start space-x-2",
              message.role === 'assistant' || message.role === 'system' || message.role === 'agent' ? 'justify-start' : 'justify-end'
            )}>
              {(message.role === 'assistant' || message.role === 'system' || message.role === 'agent') && getMessageIcon(message)}
              <div className={cn(
                "max-w-[80%] rounded-lg p-3",
                message.role === 'user' ? "bg-gray-50 text-gray-900" : 
                message.role === 'agent' ? "bg-gradient-to-r from-blue-50 to-purple-50 text-gray-900" :
                "bg-blue-50 text-gray-900"
              )}>
                <div className="whitespace-pre-wrap">
                  {message.content}
                </div>
                {message.analysis && renderAnalysis(message.analysis)}
              </div>
              {message.role === 'user' && getMessageIcon(message)}
            </div>
          </div>
        ))}
        {streamingContent && (
          <div className="flex items-start space-x-2">
            <Brain className="w-6 h-6 text-blue-500 mt-2" />
            <div className="max-w-[80%] rounded-lg p-3 bg-blue-50 text-gray-900">
              <div className="whitespace-pre-wrap">
                {streamingContent}
              </div>
            </div>
          </div>
        )}
        {isLoading && !streamingContent && (
          <div className="flex items-center space-x-2 text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Processing your request...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-blue-100">
        <div className="flex space-x-2 mb-2">
          <select
            value={currentModel}
            onChange={(e) => setCurrentModel(e.target.value)}
            className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
          >
            {availableModels.map(model => (
              <option key={model.id} value={model.id}>
                {model.name} - {model.description}
              </option>
            ))}
          </select>
        </div>
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

// Helper function to generate personalized plan
function generatePersonalizedPlan(ancestry: string, businessGoals: string): AnalysisResult[] {
  return [
    {
      category: 'time',
      title: 'Time Liberation Strategy',
      summary: 'Customized approach to free up your time and optimize operations.',
      recommendations: [
        'Implement automated workflow systems',
        'Create efficient task prioritization',
        'Develop time-saving protocols'
      ],
      pathways: [
        'Workflow Automation',
        'Task Management Optimization',
        'Meeting Efficiency'
      ]
    },
    {
      category: 'growth',
      title: 'Cultural Growth Journey',
      summary: 'Structured path for personal and professional development rooted in heritage.',
      recommendations: [
        'Connect with your cultural roots',
        'Develop leadership qualities based on ancestral wisdom',
        'Balance tradition with innovation'
      ],
      pathways: [
        'Cultural Identity Exploration',
        'Leadership Development',
        'Traditional Wisdom Integration'
      ]
    },
    {
      category: 'business',
      title: 'Heritage-Inspired Business Strategy',
      summary: 'Business optimization combining modern practices with cultural wisdom.',
      recommendations: [
        'Implement traditional time management techniques',
        'Create culturally-aware business processes',
        'Develop sustainable growth strategies'
      ],
      pathways: [
        'Process Automation',
        'Cultural Marketing',
        'Traditional Wisdom Integration'
      ]
    }
  ];
}

// Helper function to generate pathway response
function generatePathwayResponse(pathway: string, ancestry: string, businessGoals: string): string {
  const responses: Record<string, string> = {
    'Workflow Automation': `Based on your ${ancestry} background and goals to ${businessGoals}, I recommend these workflow automation strategies:

1. **Document Processing Automation**
   - Implement OCR for digitizing family records and business documents
   - Create automated categorization systems based on content
   - Set up approval workflows that respect traditional decision hierarchies

2. **Communication Automation**
   - Develop culturally-sensitive email templates
   - Schedule communications around cultural calendar events
   - Implement multilingual support for heritage languages

3. **Data Integration**
   - Connect your cultural heritage database with business systems
   - Create dashboards showing both business metrics and cultural preservation metrics
   - Implement automated backup systems for irreplaceable cultural data

Would you like me to help you implement any of these specific workflow automations?`,

    'Cultural Identity Exploration': `Based on your ${ancestry} background, here's how we can explore and integrate your cultural identity:

1. **Heritage Mapping**
   - Document your family's migration patterns and cultural touchpoints
   - Identify key cultural practices that have shaped your identity
   - Create a visual representation of your cultural influences

2. **Tradition Documentation**
   - Record oral histories from family elders
   - Document recipes, crafts, and other traditional practices
   - Create a digital archive of cultural artifacts and their significance

3. **Modern Integration**
   - Identify cultural values that align with your business goals of ${businessGoals}
   - Develop strategies to incorporate traditional wisdom into modern business practices
   - Create a personal manifesto that bridges your heritage and future vision

Would you like to start with any of these specific areas?`,

    'Traditional Wisdom Integration': `Drawing from your ${ancestry} heritage, here's how we can integrate traditional wisdom into your business goals of ${businessGoals}:

1. **Cultural Value Assessment**
   - Identify core values from your cultural background
   - Map these values to modern business principles
   - Create a framework for decision-making that honors both

2. **Knowledge Preservation Systems**
   - Develop methods to document traditional knowledge
   - Create systems to apply ancestral wisdom to current challenges
   - Build a knowledge base that connects heritage insights to business applications

3. **Mentorship Programs**
   - Design mentorship structures based on traditional knowledge-sharing
   - Create cross-generational learning opportunities
   - Develop leadership training that incorporates cultural wisdom

Which of these areas would you like to explore first?`
  };

  return responses[pathway] || `I'll help you explore the ${pathway} pathway, considering your ${ancestry} background and business goals to ${businessGoals}.`;
}

// Helper function to generate option response
function generateOptionResponse(option: string, userName: string, ancestry: string, businessGoals: string): string {
  if (option.includes('automated workflow')) {
    return `I'd be happy to help you implement automated workflow systems, ${userName}. Based on your ${ancestry} background and goals to ${businessGoals}, here are some tailored recommendations:

1. **Start with process mapping**
   - Document your current workflows, noting where cultural considerations are important
   - Identify bottlenecks and repetitive tasks that can be automated
   - Prioritize processes that will save the most time while preserving cultural integrity

2. **Select appropriate automation tools**
   - Consider n8n for workflow automation with its visual builder
   - Zapier for connecting with 5000+ apps without coding
   - Make for more complex automations with conditional logic

3. **Implementation roadmap**
   - Begin with a simple automation pilot (email responses, document processing)
   - Measure time savings and cultural alignment
   - Gradually expand to more complex workflows

Would you like me to help you get started with a specific workflow?`;
  } else if (option.includes('cultural roots')) {
    return `Connecting with your cultural roots is a wonderful journey, ${userName}. With your ${ancestry} background in mind, here are some meaningful ways to deepen this connection:

1. **Family history documentation**
   - Record interviews with elder family members
   - Create a digital family tree with cultural context notes
   - Collect and digitize family photographs and documents

2. **Cultural practice integration**
   - Identify key traditions that resonate with you personally
   - Schedule regular practice of cultural activities (cooking, language, crafts)
   - Connect with community groups that share your heritage

3. **Heritage travel planning**
   - Research significant locations in your family history
   - Plan visits to ancestral villages or regions
   - Prepare by learning relevant cultural protocols and language basics

Which of these approaches would you like to explore further?`;
  } else {
    return `I understand you'd like help with: ${option}. Based on your ${ancestry} background and business goals related to ${businessGoals}, I can provide personalized guidance in this area.

Let me know if you'd like me to elaborate on any specific aspect of this topic, or if you have any questions about how to implement these ideas in your specific context.`;
  }
}

// Helper function to generate response
function generateResponse(input: string, userName: string, ancestry: string, businessGoals: string): string {
  if (input.toLowerCase().includes('automation') || input.toLowerCase().includes('workflow')) {
    return `I understand you're interested in automation, ${userName}. Based on your ${ancestry} background and goals to ${businessGoals}, here are some tailored recommendations:

1. **Business Process Automation**
   - Document current workflows with cultural considerations in mind
   - Identify repetitive tasks that can be automated while preserving cultural integrity
   - Implement automation tools that respect your cultural values

2. **Cultural Knowledge Management**
   - Create systems to document and preserve cultural knowledge
   - Develop automated categorization for cultural artifacts
   - Implement AI-assisted translation for heritage language materials

3. **Customer Journey Automation**
   - Design culturally-sensitive automated communication sequences
   - Create personalized experiences that reflect your heritage values
   - Develop automated follow-up systems that respect cultural communication norms

Would you like me to elaborate on any of these areas?`;
  } else if (input.toLowerCase().includes('heritage') || input.toLowerCase().includes('culture')) {
    return `Your interest in cultural heritage is wonderful, ${userName}. With your ${ancestry} background, here are some ways to preserve and integrate your heritage:

1. **Digital Heritage Preservation**
   - Create a structured digital archive of family stories, recipes, and traditions
   - Record oral histories from elder family members
   - Document cultural practices with photos, videos, and detailed descriptions

2. **Cultural Integration in Business**
   - Identify cultural values that align with your business goals of ${businessGoals}
   - Incorporate traditional design elements into your brand identity
   - Develop products or services that honor and showcase your heritage

3. **Community Connection**
   - Find or create groups that celebrate your specific cultural background
   - Participate in cultural events and festivals
   - Share your heritage knowledge through workshops or social media

Which aspect would you like to explore further?`;
  } else {
    return `Thank you for your message, ${userName}. I understand you're asking about: "${input}"

As your AI assistant, I can help with both business automation and cultural heritage exploration, tailored to your ${ancestry} background and business goals of ${businessGoals}.

Would you like me to provide more specific guidance on this topic, or would you prefer to explore one of the pathways I suggested earlier?`;
  }
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}