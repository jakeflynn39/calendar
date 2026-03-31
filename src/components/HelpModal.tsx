import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface HelpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const sections = [
  {
    title: "Location",
    text: "Search by city, zip, or coordinates. Or pick a point on the map.",
  },
  {
    title: "Event time",
    text: "Pick the day and time window you're planning for.",
  },
  {
    title: "Compare weeks",
    text: "Use the arrows to flip between upcoming weeks and compare side by side.",
  },
  {
    title: "Charts",
    text: "Temperature and precipitation charts are below the cards.",
  },
];

export default function HelpModal({ open, onOpenChange }: HelpModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Quick guide</DialogTitle>

          <DialogDescription>
            Everything you need to plan the perfect outdoor meetup.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {sections.map((s) => (
            <div key={s.title}>
              <h3 className="text-sm font-semibold">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
