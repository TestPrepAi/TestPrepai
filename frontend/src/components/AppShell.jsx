import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import OnboardingDialog from "@/components/OnboardingDialog";

export default function AppShell({ children, title = "Home" }) {
  return (
    <div className="min-h-screen bg-[#F7F7FB]">
      <Sidebar />
      <OnboardingDialog />
      <div className="lg:pl-64">
        <TopBar title={title} />
        <main className="px-6 lg:px-10 py-6 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
