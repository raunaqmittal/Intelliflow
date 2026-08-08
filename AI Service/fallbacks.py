# fallbacks.py
# Static fallback workflow templates used when the LLM is unavailable or times out.
# These are exact copies of FALLBACK_WORKFLOWS from the original aiWorkflowAgent.js.
# Keep in sync with Back End/Utilities/aiWorkflowAgent.js (the Node.js last-resort fallback).

FALLBACK_WORKFLOWS: dict = {
    "web_dev": {
        "estimatedDuration": 320,
        "taskBreakdown": [
            {
                "taskName": "Requirements Analysis & Planning",
                "team": "research",
                "estimatedHours": 40,
                "requiredSkills": ["Business Analysis", "User Research", "Documentation"],
            },
            {
                "taskName": "UI/UX Design",
                "team": "design",
                "estimatedHours": 60,
                "requiredSkills": ["Figma", "UI/UX", "Web Design", "Wireframing"],
            },
            {
                "taskName": "Frontend Development",
                "team": "development",
                "estimatedHours": 120,
                "requiredSkills": ["React", "JavaScript", "HTML", "CSS", "TypeScript"],
            },
            {
                "taskName": "Backend Development",
                "team": "development",
                "estimatedHours": 80,
                "requiredSkills": ["Node.js", "Express", "MongoDB", "REST API"],
            },
            {
                "taskName": "Testing & QA",
                "team": "testing",
                "estimatedHours": 20,
                "requiredSkills": ["Testing", "QA", "Jest", "Debugging"],
            },
        ],
    },
    "app_dev": {
        "estimatedDuration": 400,
        "taskBreakdown": [
            {
                "taskName": "Requirements Analysis & Planning",
                "team": "research",
                "estimatedHours": 50,
                "requiredSkills": ["Business Analysis", "User Research", "Mobile Strategy"],
            },
            {
                "taskName": "UI/UX Design",
                "team": "design",
                "estimatedHours": 80,
                "requiredSkills": ["Figma", "UI/UX", "Mobile Design", "Prototyping"],
            },
            {
                "taskName": "Mobile App Development",
                "team": "development",
                "estimatedHours": 180,
                "requiredSkills": ["React Native", "Mobile Development", "JavaScript", "TypeScript"],
            },
            {
                "taskName": "Backend API Development",
                "team": "development",
                "estimatedHours": 70,
                "requiredSkills": ["Node.js", "Express", "MongoDB", "REST API"],
            },
            {
                "taskName": "Testing & QA",
                "team": "testing",
                "estimatedHours": 20,
                "requiredSkills": ["Mobile Testing", "QA", "Debugging"],
            },
        ],
    },
    "prototype": {
        "estimatedDuration": 120,
        "taskBreakdown": [
            {
                "taskName": "Requirement Gathering",
                "team": "research",
                "estimatedHours": 20,
                "requiredSkills": ["User Research", "Requirements Analysis"],
            },
            {
                "taskName": "Prototype Design",
                "team": "design",
                "estimatedHours": 60,
                "requiredSkills": ["Figma", "Prototyping", "UI/UX", "Wireframing"],
            },
            {
                "taskName": "Interactive Prototype Development",
                "team": "development",
                "estimatedHours": 40,
                "requiredSkills": ["JavaScript", "Prototyping", "Frontend"],
            },
        ],
    },
    "research": {
        "estimatedDuration": 80,
        "taskBreakdown": [
            {
                "taskName": "Research & Analysis",
                "team": "research",
                "estimatedHours": 80,
                "requiredSkills": ["Research", "Analysis", "Documentation"],
            }
        ],
    },
}
