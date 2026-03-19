import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import AnimatedCounter from './AnimatedCounter';
import { Utensils, Users, Building2, Recycle } from 'lucide-react';

const ImpactSection = () => {
  const { t } = useLanguage();

  const stats = [
    { icon: Utensils, target: 125000, suffix: '+', label: t('impact.meals') },
    { icon: Users, target: 3200, suffix: '+', label: t('impact.donors') },
    { icon: Building2, target: 480, suffix: '+', label: t('impact.ngos') },
    { icon: Recycle, target: 850, suffix: '+', label: t('impact.waste') },
  ];

  return (
    <section id="impact" className="py-20 bg-foreground text-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-3">{t('impact.title')}</h2>
          <p className="text-background/60 text-lg">{t('impact.subtitle')}</p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <stat.icon className="w-7 h-7 text-primary" />
              </div>
              <AnimatedCounter target={stat.target} suffix={stat.suffix} />
              <p className="text-background/60 mt-2 text-sm font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ImpactSection;
