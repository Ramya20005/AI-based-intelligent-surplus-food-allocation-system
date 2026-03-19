import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { UtensilsCrossed, Brain, ShieldCheck, Route, Truck } from 'lucide-react';

const HowItWorksSection = () => {
  const { t } = useLanguage();

  const steps = [
    { icon: UtensilsCrossed, title: t('how.step1.title'), desc: t('how.step1.desc'), color: 'bg-primary/10 text-primary' },
    { icon: Brain, title: t('how.step2.title'), desc: t('how.step2.desc'), color: 'bg-secondary/10 text-secondary' },
    { icon: ShieldCheck, title: t('how.step3.title'), desc: t('how.step3.desc'), color: 'bg-accent/10 text-accent' },
    { icon: Route, title: t('how.step4.title'), desc: t('how.step4.desc'), color: 'bg-primary/10 text-primary' },
    { icon: Truck, title: t('how.step5.title'), desc: t('how.step5.desc'), color: 'bg-secondary/10 text-secondary' },
  ];

  return (
    <section id="how-it-works" className="py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-3">{t('how.title')}</h2>
          <p className="text-muted-foreground text-lg">{t('how.subtitle')}</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="glass-card p-6 text-center hover-lift relative"
            >
              <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                {i + 1}
              </div>
              <div className={`w-14 h-14 rounded-xl ${step.color} flex items-center justify-center mx-auto mb-4`}>
                <step.icon className="w-7 h-7" />
              </div>
              <h3 className="font-heading font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
