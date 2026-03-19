import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Leaf, Heart } from 'lucide-react';

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-foreground text-background/80">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Leaf className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-heading font-bold text-lg text-background">
                FoodShare<span className="text-primary">AI</span>
              </span>
            </div>
            <p className="text-sm text-background/60 leading-relaxed">
              {t('footer.tagline')}
            </p>
          </div>
          <div>
            <h4 className="font-heading font-semibold text-background mb-4">{t('footer.quickLinks')}</h4>
            <div className="space-y-2">
              <Link to="/" className="block text-sm text-background/60 hover:text-primary transition-colors">{t('nav.home')}</Link>
              <Link to="/#about" className="block text-sm text-background/60 hover:text-primary transition-colors">{t('nav.about')}</Link>
              <Link to="/#contact" className="block text-sm text-background/60 hover:text-primary transition-colors">{t('nav.contact')}</Link>
            </div>
          </div>
          <div>
            <h4 className="font-heading font-semibold text-background mb-4">{t('footer.legal')}</h4>
            <div className="space-y-2">
              <span className="block text-sm text-background/60">{t('footer.privacy')}</span>
              <span className="block text-sm text-background/60">{t('footer.terms')}</span>
            </div>
          </div>
        </div>
        <div className="border-t border-background/10 mt-8 pt-6 text-center text-sm text-background/40">
          <p className="flex items-center justify-center gap-1">
            © 2025 FoodShareAI. {t('footer.rights')} Made with <Heart className="w-3 h-3 text-primary fill-primary" /> for a better world.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
