"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Zap, Calendar, Sparkles } from "lucide-react";

interface SubscriptionLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentShiftsCount: number;
  limit: number;
  message?: string;
}

export function SubscriptionLimitModal({
  isOpen,
  onClose,
  currentShiftsCount,
  limit,
  message,
}: SubscriptionLimitModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [hasReferralDiscount, setHasReferralDiscount] = useState(false);

  // Check if user has referral discount
  useEffect(() => {
    const checkReferral = () => {
      if (typeof window !== 'undefined' && (window as any).Rewardful?.coupon) {
        setHasReferralDiscount(true);
      }
    };

    if (isOpen) {
      checkReferral();
      setTimeout(checkReferral, 500);
    }
  }, [isOpen]);

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      // Capture Rewardful referral ID and coupon if present
      const referralId = typeof window !== 'undefined' && (window as any).Rewardful?.referral;
      const couponObj = typeof window !== 'undefined' && (window as any).Rewardful?.coupon;
      const couponCode = couponObj?.id || couponObj; // Handle both object and string formats

      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          referralId,
          couponCode,
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("Failed to create checkout session");
        alert("Failed to start checkout. Please try again.");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        {/* Referral Discount Badge */}
        {hasReferralDiscount && (
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 px-4 text-center rounded-t-lg">
            <div className="flex items-center justify-center gap-2 text-sm font-semibold">
              <Sparkles className="w-4 h-4" />
              <span>30% Off First Month!</span>
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
        )}

        <DialogHeader className={hasReferralDiscount ? 'mt-8' : ''}>
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <DialogTitle className="text-center text-xl">
            You've reached your free limit
          </DialogTitle>
          <DialogDescription className="text-center text-base pt-2">
            {message || `You currently have ${currentShiftsCount} upcoming shifts. Free users are limited to ${limit} shifts.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Upgrade to Plus</h4>
                <p className="text-sm text-gray-600">Unlock unlimited access and premium features</p>
                {hasReferralDiscount && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-400 line-through">$10</span>
                    <span className="text-2xl font-bold text-green-600">$7</span>
                    <span className="text-xs text-green-600 font-semibold">first month</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Free Plan</h4>
                <p className="text-sm text-gray-600">Up to {limit} upcoming shifts at a time</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Button
            onClick={handleUpgrade}
            disabled={isLoading}
            className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold"
          >
            {isLoading ? "Loading..." : hasReferralDiscount ? "Upgrade to Plus - $7 First Month" : "Upgrade to Plus - $10/mo"}
          </Button>
          <Button
            onClick={onClose}
            variant="ghost"
            disabled={isLoading}
            className="w-full text-gray-600 hover:text-gray-700"
          >
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
