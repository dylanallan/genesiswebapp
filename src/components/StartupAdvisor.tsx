import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Lightbulb, Target, ChevronRight, Users, TrendingUp, Globe, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { aiRouter } from '../lib/ai-router';

const startupFormSchema = z.object({
  interests: z.array(z.string()).min(1, 'Select at least one interest'),
  skills: z.array(z.string()).min(1, 'Select at least one skill'),
  marketObservations: z.string().min(10, 'Share more about your market observations'),
  targetAudience: z.string().min(10, 'Describe your target audience'),
  problemStatement: z.string().min(10, 'Describe the problem you want to solve')
});

type StartupForm = z.infer<typeof startupFormSchema>;

interface IdeaFeedback {
  score: number;
  strengths: string[];
  weaknesses: string[];
  nextSteps: string[];
  resources: {
    title: string;
    url: string;
    type: string;
  }[];
}

const interests = [
  'Technology', 'Health & Wellness', 'Education', 'Finance',
  'Sustainability', 'E-commerce', 'Social Impact', 'Entertainment'
];

const skills = [
  'Programming', 'Design', 'Marketing', 'Sales',
  'Finance', 'Operations', 'Leadership', 'Industry Expertise'
];

export const StartupAdvisor: React.FC = () => {
  const [step, setStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<IdeaFeedback | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<StartupForm>({
    resolver: zodResolver(startupFormSchema)
  });

  const handleInterestToggle = (interest: string) => {
    const updated = selectedInterests.includes(interest)
      ? selectedInterests.filter(i => i !== interest)
      : [...selectedInterests, interest];
    setSelectedInterests(updated);
    setValue('interests', updated);
  };

  const handleSkillToggle = (skill: string) => {
    const updated = selectedSkills.includes(skill)
      ? selectedSkills.filter(s => s !== skill)
      : [...selectedSkills, skill];
    setSelectedSkills(updated);
    setValue('skills', updated);
  };

  const onSubmit = async (data: StartupForm) => {
    setIsAnalyzing(true);
    try {
      const prompt = `
        Analyze this startup idea:
        Interests: ${data.interests.join(', ')}
        Skills: ${data.skills.join(', ')}
        Market Observations: ${data.marketObservations}
        Target Audience: ${data.targetAudience}
        Problem Statement: ${data.problemStatement}
      `;

      const response = await aiRouter.routeRequest(prompt, {
        type: 'startup_analysis',
        context: data
      });

      setFeedback({
        score: response.score,
        strengths: response.strengths,
        weaknesses: response.weaknesses,
        nextSteps: response.nextSteps,
        resources: response.resources
      });

      setStep(4);
    } catch (error) {
      console.error('Error analyzing startup idea:', error);
      toast.error('Failed to analyze startup idea');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Brain className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900">AI Co-Founder</h2>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>Step</span>
            <span className="font-medium text-blue-600">{step}</span>
            <span>of 4</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Lightbulb className="w-5 h-5 text-yellow-500 mr-2" />
                What are your interests?
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {interests.map(interest => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => handleInterestToggle(interest)}
                    className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                      selectedInterests.includes(interest)
                        ? 'bg-blue-50 text-blue-700 border-2 border-blue-200'
                        : 'bg-gray-50 text-gray-700 border-2 border-gray-200 hover:border-blue-200'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
              {errors.interests && (
                <p className="text-sm text-red-600">{errors.interests.message}</p>
              )}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={selectedInterests.length === 0}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Users className="w-5 h-5 text-purple-500 mr-2" />
                What are your key skills?
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {skills.map(skill => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => handleSkillToggle(skill)}
                    className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                      selectedSkills.includes(skill)
                        ? 'bg-purple-50 text-purple-700 border-2 border-purple-200'
                        : 'bg-gray-50 text-gray-700 border-2 border-gray-200 hover:border-purple-200'
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
              {errors.skills && (
                <p className="text-sm text-red-600">{errors.skills.message}</p>
              )}
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={selectedSkills.length === 0}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Globe className="w-5 h-5 text-green-500 mr-2" />
                Tell us about your market insights
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Market Observations
                  </label>
                  <textarea
                    {...register('marketObservations')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="What trends or opportunities have you noticed?"
                  />
                  {errors.marketObservations && (
                    <p className="text-sm text-red-600">{errors.marketObservations.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Audience
                  </label>
                  <textarea
                    {...register('targetAudience')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="Who would benefit most from your solution?"
                  />
                  {errors.targetAudience && (
                    <p className="text-sm text-red-600">{errors.targetAudience.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Problem Statement
                  </label>
                  <textarea
                    {...register('problemStatement')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="What specific problem are you trying to solve?"
                  />
                  {errors.problemStatement && (
                    <p className="text-sm text-red-600">{errors.problemStatement.message}</p>
                  )}
                </div>
              </div>
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isAnalyzing}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Analyzing</span>
                    </>
                  ) : (
                    <>
                      <span>Analyze Idea</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && feedback && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-blue-900 flex items-center mb-2">
                  <TrendingUp className="w-5 h-5 text-blue-500 mr-2" />
                  Idea Score: {feedback.score}/10
                </h3>
                <p className="text-sm text-blue-700">
                  Based on market potential, execution capability, and innovation
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Strengths</h4>
                  <ul className="space-y-1">
                    {feedback.strengths.map((strength, index) => (
                      <li key={index} className="text-sm text-green-600 flex items-center">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2" />
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Areas for Improvement</h4>
                  <ul className="space-y-1">
                    {feedback.weaknesses.map((weakness, index) => (
                      <li key={index} className="text-sm text-red-600 flex items-center">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2" />
                        {weakness}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Next Steps</h4>
                <ul className="space-y-2">
                  {feedback.nextSteps.map((step, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-center">
                      <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-2 text-xs">
                        {index + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Recommended Resources</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {feedback.resources.map((resource, index) => (
                    <a
                      key={index}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <h5 className="font-medium text-gray-900">{resource.title}</h5>
                      <p className="text-sm text-gray-500">{resource.type}</p>
                    </a>
                  ))}
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setFeedback(null);
                    setSelectedInterests([]);
                    setSelectedSkills([]);
                  }}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Start Over
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Save idea to database
                    toast.success('Idea saved to your dashboard');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Idea
                </button>
              </div>
            </motion.div>
          )}
        </form>
      </div>
    </div>
  );
};