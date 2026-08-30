const handleCreateIncident = async () => {
    if (!analysisResult || !analysisResult.isRelevant) return;

    const newId = `INC-2026-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date();
    const formattedTimestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} IST`;

    const urgencyLevel = analysisResult.recommendedPriority === 'Immediate Response' 
      ? 'Immediate' 
      : analysisResult.recommendedPriority === 'High Priority' 
        ? 'Elevated' 
        : 'Monitoring';

    const newIncident: Incident = {
      id: newId,
      location: analysisResult.primaryLocation || analysisResult.location,
      extractedLocation: analysisResult.primaryLocation || analysisResult.location,
      primaryLocation: analysisResult.primaryLocation || analysisResult.location,
      secondaryLocations: analysisResult.secondaryLocations || [],
      landmark: `${(analysisResult.primaryLocation || analysisResult.location).split(',')[0]} Emergency Sector`,
      coordinates: analysisResult.coordinates,
      disasterType: analysisResult.disasterType,
      severity: analysisResult.severity,
      aiConfidence: analysisResult.aiConfidence,
      confidence: analysisResult.confidence || analysisResult.aiConfidence,
      locationConfidence: analysisResult.locationConfidence,
      detectedSignals: [...analysisResult.detectedSignals],
      hazards: analysisResult.hazards ? [...analysisResult.hazards] : [],
      responseNeeded: analysisResult.responseNeeded ? [...analysisResult.responseNeeded] : [],
      recommendedPriority: analysisResult.recommendedPriority,
      engineUsed: analysisResult.engineUsed,
      source: 'Citizen WhatsApp',
      timeAgo: 'Just now',
      timestamp: formattedTimestamp,
      originalReport: reportText.trim(),
      status: 'Pending',
      verificationStatus: 'Pending',
      entitiesExtracted: {
        urgency: urgencyLevel,
        peopleTrapped: analysisResult.extractedEntities.peopleTrapped,
        waterLevel: analysisResult.extractedEntities.waterLevel || (analysisResult.severity === 'Critical' ? '3.5 ft (Rapidly Rising)' : '2.0 ft'),
        affectedArea: analysisResult.primaryLocation || analysisResult.location,
      },
    };

    // Save newly created incident directly into Supabase
    const { error } = await supabase
      .from('incidents')
      .insert([newIncident]);

    if (error) {
      console.error('Error inserting incident into Supabase:', error);
    }

    onCreateIncident(newIncident);
    setCreatedIncidentId(newId);
  };
