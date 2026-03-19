import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

const HeroSection = () => {
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleAction = (type: 'donate' | 'request') => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (type === 'donate') navigate('/donor-dashboard');
    else navigate('/ngo-dashboard');
  };

  return (
    <section className="relative overflow-hidden gradient-hero py-16 md:py-24">
      <div className="absolute top-10 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center"
        >
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              AI-Powered Food Redistribution
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-heading font-extrabold leading-tight mb-6">
              {t('hero.title')}{' '}
              <span className="text-gradient">{t('hero.titleHighlight')}</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-8 max-w-2xl mx-auto lg:mx-0">
              {t('hero.subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row items-center lg:items-start gap-4">
              <button
                onClick={() => handleAction('donate')}
                className="group flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3.5 rounded-xl font-semibold text-base hover:opacity-90 transition-all shadow-glow hover:shadow-lg"
              >
                {t('hero.donate')}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => handleAction('request')}
                className="group flex items-center gap-2 bg-accent text-accent-foreground px-8 py-3.5 rounded-xl font-semibold text-base hover:opacity-90 transition-all"
              >
                {t('hero.request')}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="relative overflow-hidden rounded-3xl border border-white/40 shadow-2xl">
              <img
                src="/hero-ai-donor-ngo.png"
                alt="People handling donated food with AI-enabled redistribution"
                onError={(event) => {
                  event.currentTarget.src = "/placeholder.svg";
                }}
                className="w-full h-[300px] sm:h-[360px] md:h-[420px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/45 via-emerald-900/10 to-transparent" />
              <div className="absolute top-4 right-4 rounded-full bg-white/90 text-foreground text-xs sm:text-sm font-semibold px-3 py-1.5 border border-white/70">
                AI Quality Verified
              </div>
              <div className="absolute bottom-4 left-4 right-4 glass-card p-3 sm:p-4">
                <p className="text-sm sm:text-base font-semibold">Donor + AI + NGO Integrated Flow</p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Food upload, AI safety prediction, and NGO allocation in one smart workflow.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
