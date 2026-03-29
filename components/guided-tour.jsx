"use client";
import React, {
  useState,
  useEffect,
  useRef,
  createContext,
  useContext,
  useCallback,
  useMemo,
} from 'react';
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

const useDisableMouseScroll = (isDisabled) => {
  useEffect(() => {
    if (!isDisabled) return

    const preventMouseScroll = (e) => {
      e.preventDefault()
    }

    window.addEventListener('wheel', preventMouseScroll, { passive: false })
    return () => window.removeEventListener('wheel', preventMouseScroll);
  }, [isDisabled])
}

const TourContext = createContext(null);

export const useTour = () => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
};

const TourOverlay = () => {
  const { isActive, currentStepId } = useTour()
  const [highlightStyle, setHighlightStyle] = useState({})
  const rafRef = useRef(undefined)

  useDisableMouseScroll(isActive)

  const updateHighlight = useCallback(() => {
    if (!isActive || !currentStepId) return

    const stepElement = document.querySelector(`[data-tour-step="${currentStepId}"]`)
    if (!stepElement) return

    const rect = stepElement.getBoundingClientRect()
    const padding = 8

    setHighlightStyle({
      transform: `translate(${rect.left - padding}px, ${rect.top - padding}px)`,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    })
  }, [isActive, currentStepId])

  useEffect(() => {
    if (!isActive || !currentStepId) {
      setHighlightStyle({})
      return
    }

    updateHighlight()

    const handleUpdate = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(updateHighlight)
    }

    window.addEventListener('scroll', handleUpdate, { passive: true })
    window.addEventListener('resize', handleUpdate, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleUpdate)
      window.removeEventListener('resize', handleUpdate)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    };
  }, [isActive, currentStepId, updateHighlight])

  if (!isActive || !highlightStyle.width) return null

  return (
    <div className="fixed inset-0 z-10000 pointer-events-auto">
      <div
        className="fixed inset-0 bg-black/30 z-10001 backdrop-blur-xs pointer-events-auto" />
      <div
        className="absolute rounded-xl pointer-events-none transition-all duration-300 ease-out"
        style={highlightStyle} />
    </div>
  );
}

const GlobalTourPopover = () => {
  const {
    isActive,
    currentStepId,
    currentStepIndex,
    totalSteps,
    nextStep,
    prevStep,
    stopTour
  } = useTour()

  const [currentStepData, setCurrentStepData] = useState(null)
  const [popoverStyle, setPopoverStyle] = useState({})
  const popoverRef = useRef(null)
  const rafRef = useRef(undefined)

  const updatePosition = useCallback(() => {
    if (!isActive || !currentStepId || !popoverRef.current) return

    const stepElement = document.querySelector(`[data-tour-step="${currentStepId}"]`)
    if (!stepElement) return

    const stepData = JSON.parse(stepElement.getAttribute('data-tour-config') || '{}')
    const targetRect = stepElement.getBoundingClientRect()
    const popoverRect = popoverRef.current.getBoundingClientRect()

    const margin = 16
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let top = targetRect.bottom + margin
    let left = targetRect.left + (targetRect.width / 2) - (popoverRect.width / 2)

    if (stepData.position === 'top') {
      top = targetRect.top - popoverRect.height - margin
    } else if (stepData.position === 'left') {
      top = targetRect.top + (targetRect.height / 2) - (popoverRect.height / 2)
      left = targetRect.left - popoverRect.width - margin
    } else if (stepData.position === 'right') {
      top = targetRect.top + (targetRect.height / 2) - (popoverRect.height / 2)
      left = targetRect.right + margin
    }

    top = Math.max(margin, Math.min(top, viewportHeight - popoverRect.height - margin))
    left = Math.max(margin, Math.min(left, viewportWidth - popoverRect.width - margin))

    setPopoverStyle({
      position: 'fixed',
      top,
      left,
      zIndex: 10003,
    })
  }, [isActive, currentStepId])

  useEffect(() => {
    if (!isActive || !currentStepId) {
      setCurrentStepData(null)
      setPopoverStyle({})
      return
    }

    const stepElement = document.querySelector(`[data-tour-step="${currentStepId}"]`)
    if (!stepElement) return

    const stepData = JSON.parse(stepElement.getAttribute('data-tour-config') || 'null')
    setCurrentStepData(stepData)

    stepElement.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest'
    })

    const handleUpdate = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(updatePosition)
    }

    setTimeout(updatePosition, 100)

    window.addEventListener('scroll', handleUpdate, { passive: true })
    window.addEventListener('resize', handleUpdate, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleUpdate)
      window.removeEventListener('resize', handleUpdate)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    };
  }, [isActive, currentStepId, updatePosition])

  if (!currentStepData) return null

  const isLastStep = currentStepIndex === totalSteps - 1
  const isFirstStep = currentStepIndex === 0

  return (
    <div
      ref={popoverRef}
      className="w-80 transition-all duration-300 ease-out"
      style={popoverStyle}>
      <Card className="border-2 border-primary/20 backdrop-blur-xs shadow-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-semibold">
                {currentStepIndex + 1}
              </div>
              <CardTitle className="text-lg">{currentStepData.title}</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={stopTour}
              className="h-6 w-6 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5">
            <div
              className="bg-primary h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }} />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <CardDescription className="text-sm leading-relaxed mb-4">
            {currentStepData.content}
          </CardDescription>
          <div className="flex items-center justify-between">
            <div className="flex gap-2 ml-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={stopTour}
                className="text-muted-foreground hover:text-foreground">
                Skip Tour
              </Button>
              {!isFirstStep && (
                <Button variant="outline" size="sm" onClick={prevStep}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              )}
              <Button size="sm" onClick={nextStep}>
                {isLastStep ? 'Finish' : 'Next'}
                {!isLastStep && <ChevronRight className="h-4 w-4 ml-1" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export const TourProvider = ({
  children,
  autoStart = false,
  ranOnce = true,
  storageKey = 'rigidui-tour-completed',
  shouldStart = true,
  onTourComplete,
  onTourSkip
}) => {
  const [steps, setSteps] = useState(new Map());
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [activeSteps, setActiveSteps] = useState([]);
  const [hasAutoStarted, setHasAutoStarted] = useState(false);

  const registerStep = useCallback((stepConfig, element) => {
    setSteps(prev => {
      const newSteps = new Map(prev);
      newSteps.set(stepConfig.id, { ...stepConfig, element });
      return newSteps;
    });
  }, []);

  const unregisterStep = useCallback((id) => {
    setSteps(prev => {
      const newSteps = new Map(prev);
      newSteps.delete(id);
      return newSteps;
    });
  }, []);

  useEffect(() => {
    if (autoStart && !hasAutoStarted && steps.size > 0 && shouldStart) {
      const tourCompleted = ranOnce && typeof window !== 'undefined' ? localStorage.getItem(storageKey) === 'true' : false;

      if (!tourCompleted) {
        const timer = setTimeout(() => {
          const filteredSteps = Array.from(steps.values())
            .sort((a, b) => a.order - b.order);

          if (filteredSteps.length > 0) {
            setActiveSteps(filteredSteps);
            setCurrentStep(0);
            setIsActive(true);
          }
          setHasAutoStarted(true);
        }, 500);
        return () => clearTimeout(timer);
      } else {
        setHasAutoStarted(true);
      }
    }
  }, [autoStart, hasAutoStarted, steps, ranOnce, storageKey, shouldStart]);

  const startTour = useCallback(() => {
    const filteredSteps = Array.from(steps.values())
      .sort((a, b) => a.order - b.order)

    if (filteredSteps.length > 0) {
      setActiveSteps(filteredSteps)
      setCurrentStep(0)
      setIsActive(true)
    }
  }, [steps])

  const stopTour = useCallback((completed = false) => {
    const wasActive = isActive

    setIsActive(false)
    setCurrentStep(0)
    setActiveSteps([])

    if (wasActive) {
      if (completed) {
        if (ranOnce && typeof window !== 'undefined') {
          localStorage.setItem(storageKey, 'true')
        }
        onTourComplete?.()
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('tourCompleted', { detail: { storageKey } }))
        }
      } else if (!completed) {
        onTourSkip?.()
      }
    }
  }, [isActive, ranOnce, storageKey, onTourComplete, onTourSkip])

  const nextStep = useCallback(() => {
    if (currentStep < activeSteps.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      stopTour(true)
    }
  }, [currentStep, activeSteps.length, stopTour])

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }, [currentStep])

  const resetTourCompletion = useCallback(() => {
    if (ranOnce && typeof window !== 'undefined') {
      localStorage.removeItem(storageKey)
      setHasAutoStarted(false)
      window.dispatchEvent(new CustomEvent('tourReset', { detail: { storageKey } }))
    }
  }, [ranOnce, storageKey])

  const contextValue = useMemo(() => ({
    registerStep,
    unregisterStep,
    startTour,
    stopTour: () => stopTour(false),
    nextStep,
    prevStep,
    resetTourCompletion,
    isActive,
    currentStepId: activeSteps[currentStep]?.id || null,
    currentStepIndex: currentStep,
    totalSteps: activeSteps.length
  }), [
    registerStep,
    unregisterStep,
    startTour,
    stopTour,
    nextStep,
    prevStep,
    resetTourCompletion,
    isActive,
    activeSteps,
    currentStep
  ])

  return (
    <TourContext.Provider value={contextValue}>
      {children}
      <TourOverlay />
      <GlobalTourPopover />
    </TourContext.Provider>
  );
}

const TourStepComponent = ({ children, id, title, content, order, position }) => {
  const { registerStep, unregisterStep, isActive, currentStepId } = useTour()
  const elementRef = useRef(null)

  const stepConfig = useMemo(
    () => ({ id, title, content, order, position }),
    [id, title, content, order, position]
  )

  useEffect(() => {
    if (elementRef.current) {
      registerStep(stepConfig, elementRef.current)
    }
    return () => unregisterStep(id);
  }, [stepConfig, registerStep, unregisterStep, id])

  const isCurrentStep = isActive && currentStepId === id

  return (
    <div
      ref={elementRef}
      data-tour-step={id}
      data-tour-config={JSON.stringify(stepConfig)}
      className={isCurrentStep ? "relative z-10002" : "relative"}>
      {children}
    </div>
  );
}

export const TourStep = React.memo(TourStepComponent)

export const TourTrigger = ({ children, className, hideAfterComplete = false, storageKey = 'rigidui-tour-completed' }) => {
  const { startTour } = useTour()
  const [tourCompleted, setTourCompleted] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // Set isClient to true after mount to avoid hydration mismatch
    setIsClient(true)
    
    // Check localStorage only on client side
    if (hideAfterComplete && typeof window !== 'undefined') {
      const completed = localStorage.getItem(storageKey) === 'true'
      setTourCompleted(completed)
    }
  }, [hideAfterComplete, storageKey])

  useEffect(() => {
    if (!hideAfterComplete) return

    const handleTourComplete = (event) => {
      const customEvent = event
      const eventStorageKey = customEvent.detail?.storageKey || 'rigidui-tour-completed'
      if (eventStorageKey === storageKey) {
        if (typeof window !== 'undefined') {
          localStorage.setItem(storageKey, 'true')
        }
        setTourCompleted(true)
      }
    }

    const handleTourReset = (event) => {
      const customEvent = event
      const eventStorageKey = customEvent.detail?.storageKey || 'rigidui-tour-completed'
      if (eventStorageKey === storageKey) {
        setTourCompleted(false)
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('tourCompleted', handleTourComplete)
      window.addEventListener('tourReset', handleTourReset)

      return () => {
        window.removeEventListener('tourCompleted', handleTourComplete)
        window.removeEventListener('tourReset', handleTourReset)
      };
    }
  }, [hideAfterComplete, storageKey])

  const handleClick = useCallback((e) => {
    e.preventDefault()
    startTour()
  }, [startTour])

  // Don't hide on server-side render to avoid hydration mismatch
  // Only hide after client-side hydration
  if (hideAfterComplete && isClient && tourCompleted) return null

  return (
    <div onClick={handleClick} className={className}>
      {children}
    </div>
  );
}

export default TourProvider;
