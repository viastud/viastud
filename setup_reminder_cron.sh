#!/bin/bash

# Script pour configurer le cron job des rappels de réservation
# À exécuter une seule fois pour configurer les rappels quotidiens
# En semaine (lun-ven): 12h00, Weekend (sam-dim): 9h00

echo "🔔 Configuration des rappels quotidiens de réservation..."

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "apps/server/app/controllers/cron_controller.ts" ]; then
    echo "❌ Erreur: Ce script doit être exécuté depuis la racine du projet viastud"
    exit 1
fi

# Chemin absolu vers le projet
PROJECT_DIR=$(pwd)

echo "📁 Répertoire du projet: $PROJECT_DIR"

# Créer les cron jobs (12h en semaine, 9h le weekend)
# Note: Les rappels SMS sont maintenant gérés par le cron_controller.ts
CRON_WEEKDAY="0 12 * * 1-5 cd $PROJECT_DIR && curl -X GET https://api.viastud.fr/cron >> $PROJECT_DIR/logs/reminders.log 2>&1"
CRON_WEEKEND="0 9 * * 0,6 cd $PROJECT_DIR && curl -X GET https://api.viastud.fr/cron >> $PROJECT_DIR/logs/reminders.log 2>&1"

echo "⏰ Ajout des cron jobs:"
echo "   - En semaine (lun-ven): 12h00"
echo "   - Weekend (sam-dim): 9h00"

# Vérifier si le cron job existe déjà
if crontab -l 2>/dev/null | grep -q "api.viastud.fr/cron"; then
    echo "⚠️ Un cron job pour les rappels existe déjà"
    echo "Voulez-vous le remplacer ? (y/N)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        # Supprimer l'ancien cron job
        crontab -l 2>/dev/null | grep -v "api.viastud.fr/cron" | crontab -
        echo "🗑️ Ancien cron job supprimé"
    else
        echo "❌ Configuration annulée"
        exit 0
    fi
fi

# Ajouter les nouveaux cron jobs
(crontab -l 2>/dev/null; echo "$CRON_WEEKDAY"; echo "$CRON_WEEKEND") | crontab -

echo "✅ Cron jobs ajoutés avec succès !"
echo ""
echo "📋 Configuration:"
echo "   - En semaine (lun-ven): 12h00"
echo "   - Weekend (sam-dim): 9h00"
echo "   - Endpoint: https://api.viastud.fr/cron"
echo "   - Logs: $PROJECT_DIR/logs/reminders.log"
echo ""
echo "🔍 Pour vérifier la configuration:"
echo "   crontab -l"
echo ""
echo "🧪 Pour tester manuellement:"
echo "   curl -X GET https://api.viastud.fr/cron"
echo ""
echo "📝 Pour voir les logs:"
echo "   tail -f logs/reminders.log"

# Créer le répertoire logs s'il n'existe pas
mkdir -p logs

echo "🎉 Configuration terminée ! Les rappels seront envoyés:"
echo "   - En semaine (lun-ven) à 12h00"
echo "   - Le weekend (sam-dim) à 9h00"
