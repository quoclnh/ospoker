"use client"

import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Crown, Users, Eye, RefreshCw, Plus } from 'lucide-react'
import { motion } from 'framer-motion'

const FIBONACCI_NUMBERS = [1, 2, 3, 5, 8, 13, 21]

export default function HomePage() {
  const store = useStore()
  const [name, setName] = useState('')
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [showJoinDialog, setShowJoinDialog] = useState(true)

  useEffect(() => {
    if (!store.session) {
      store.createSession()
    }
  }, [store])

  const handleJoin = () => {
    if (name.trim()) {
      store.setUserName(name)
      store.joinSession(name)
      setShowJoinDialog(false)
    }
  }

  const handleCreateTask = () => {
    if (newTaskTitle.trim()) {
      store.createTask(newTaskTitle)
      setNewTaskTitle('')
    }
  }

  const calculateAverage = (votes: number[]) => {
    if (votes.length === 0) return 0
    return votes.reduce((a, b) => a + b, 0) / votes.length
  }

  const isSignificantlyDifferent = (vote: number, average: number) => {
    return Math.abs(vote - average) > average * 0.5
  }

  if (!store.session) return null

  const isFacilitator = store.session.facilitatorId === store.userId
  const currentTask = store.session.currentTask
  const hasVoted = currentTask?.votes.some(v => v.userId === store.userId)
  const allVotes = currentTask?.votes.map(v => v.value).filter((v): v is number => v !== null) || []
  const average = calculateAverage(allVotes)

  return (
    <div className="min-h-screen bg-background p-6">
      <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join Planning Session</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            />
            <Button onClick={handleJoin} className="w-full">Join</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Planning Poker</h1>
            {!store.session.facilitatorId && (
              <Button onClick={() => store.becomeFacilitator()}>
                <Crown className="mr-2 h-4 w-4" />
                Become Facilitator
              </Button>
            )}
          </div>

          {currentTask ? (
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">{currentTask.title}</h2>
                {isFacilitator && (
                  <div className="space-x-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline">
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Reset
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Reset Voting</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will clear all votes for the current task. Are you sure?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => store.resetVoting()}>
                            Reset
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    
                    <Button onClick={() => store.revealVotes()}>
                      <Eye className="mr-2 h-4 w-4" />
                      Reveal
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-4">
                {FIBONACCI_NUMBERS.map((number) => (
                  <motion.button
                    key={number}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`aspect-[2/3] rounded-lg border-2 ${
                      hasVoted && currentTask.votes.find(v => v.userId === store.userId)?.value === number
                        ? 'border-primary bg-primary/10'
                        : 'border-border'
                    } flex items-center justify-center text-2xl font-bold cursor-pointer`}
                    onClick={() => !currentTask.revealed && store.vote(number)}
                    disabled={currentTask.revealed}
                  >
                    {number}
                  </motion.button>
                ))}
              </div>

              {currentTask.revealed && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 bg-muted rounded-lg"
                >
                  <h3 className="text-lg font-semibold mb-2">Results</h3>
                  <div className="space-y-2">
                    {currentTask.votes.map((vote) => {
                      const participant = store.session.participants.find(p => p.id === vote.userId)
                      if (!participant || vote.value === null) return null
                      
                      return (
                        <div
                          key={vote.userId}
                          className={`flex items-center justify-between p-2 rounded ${
                            isSignificantlyDifferent(vote.value, average)
                              ? 'bg-destructive/10'
                              : 'bg-background'
                          }`}
                        >
                          <span>{participant.name}</span>
                          <span className="font-mono">{vote.value}</span>
                        </div>
                      )
                    })}
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between font-semibold">
                        <span>Average</span>
                        <span>{average.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </Card>
          ) : isFacilitator ? (
            <Card className="p-6">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Create New Task</h2>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter task title"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateTask()}
                  />
                  <Button onClick={handleCreateTask}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-6 text-center text-muted-foreground">
              Waiting for the facilitator to create a task...
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-4 w-4" />
              <h2 className="font-semibold">Participants</h2>
            </div>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {store.session.participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-2 rounded bg-muted"
                  >
                    <span>{participant.name}</span>
                    {participant.id === store.session.facilitatorId && (
                      <Crown className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>

          {isFacilitator && (
            <Card className="p-4">
              <h2 className="font-semibold mb-4">Previous Tasks</h2>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {store.session.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-2 rounded bg-muted cursor-pointer hover:bg-accent"
                      onClick={() => store.selectTask(task.id)}
                    >
                      <div className="font-medium">{task.title}</div>
                      {task.finalEstimate && (
                        <div className="text-sm text-muted-foreground">
                          Final: {task.finalEstimate}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}