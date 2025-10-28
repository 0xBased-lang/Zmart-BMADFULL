import { UserProfile } from './components/UserProfile'

interface ProfilePageProps {
  params: Promise<{ wallet: string }>
}

export default async function UserProfilePage({ params }: ProfilePageProps) {
  const { wallet } = await params
  return <UserProfile walletAddress={wallet} />
}

export async function generateMetadata({ params }: ProfilePageProps) {
  const { wallet } = await params
  return {
    title: `User ${wallet.slice(0, 6)}... | BMAD-Zmart`,
    description: `View betting statistics and activity for user ${wallet}`,
  }
}
