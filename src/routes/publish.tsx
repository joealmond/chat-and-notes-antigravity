import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/publish')({
  component: PublishPage,
})

function PublishPage() {
  return <div className="p-4">Publish Manager Placeholder</div>
}
