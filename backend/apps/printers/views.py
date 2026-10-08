from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema

from apps.clubs.models import Club
from apps.clubs.permissions import IsClubStaff, HasActiveSubscription
from .models import PrinterDevice, PrintJob, PrintJobStatus
from .serializers import (
    PrinterDeviceSerializer, PrintJobSerializer, PrintJobAckSerializer
)
from .services import create_test_print_job

class PrinterDeviceViewSet(viewsets.ModelViewSet):
    """
    Klub kassa va bar printerlarini boshqarish CRUD
    """
    serializer_class = PrinterDeviceSerializer
    permission_classes = [permissions.IsAuthenticated, IsClubStaff, HasActiveSubscription]

    def get_queryset(self):
        club_id = self.request.headers.get('X-Club-Id') or self.request.query_params.get('club_id')
        if not club_id:
            return PrinterDevice.objects.none()
        return PrinterDevice.objects.filter(club_id=club_id)

    def perform_create(self, serializer):
        club_id = self.request.headers.get('X-Club-Id') or self.request.data.get('club')
        club = get_object_or_404(Club, id=club_id)
        serializer.save(club=club)

class PrinterAgentPollView(APIView):
    """
    Desktop Print Agent uchun tezkor polling va Heartbeat API
    Header or Query: ?token=pb_prn_xxxxxx
    """
    permission_classes = [permissions.AllowAny]

    @extend_schema(responses={200: PrintJobSerializer(many=True)})
    def get(self, request):
        token = request.headers.get('X-Printer-Token') or request.query_params.get('token')
        if not token:
            return Response({"detail": "X-Printer-Token talab qilinadi."}, status=status.HTTP_400_BAD_REQUEST)

        device = PrinterDevice.objects.filter(token=token, is_active=True).select_related('club').first()
        if not device:
            return Response({"detail": "Bunday printer agent topilmadi yoki faol emas."}, status=status.HTTP_404_NOT_FOUND)

        # Update heartbeat
        device.last_seen_at = timezone.now()
        device.save(update_fields=['last_seen_at'])

        # Fetch pending jobs for this club
        pending_jobs = PrintJob.objects.filter(
            club=device.club,
            status=PrintJobStatus.PENDING
        ).order_by('created_at')[:5]

        # Device settings to include
        device_config = {
            "device_name": device.name,
            "paper_width": device.paper_width,
            "auto_cut": device.auto_cut,
            "open_cash_drawer": device.open_cash_drawer,
        }

        serializer = PrintJobSerializer(pending_jobs, many=True)
        return Response({
            "status": "ok",
            "device": device_config,
            "jobs_count": len(pending_jobs),
            "jobs": serializer.data
        })

class PrinterAgentAckView(APIView):
    """
    Print Agent chekni chiqargach xabar berish (ACK)
    """
    permission_classes = [permissions.AllowAny]

    @extend_schema(request=PrintJobAckSerializer, responses={200: dict})
    def post(self, request):
        token = request.headers.get('X-Printer-Token') or request.data.get('token')
        if not token:
            return Response({"detail": "Token talab qilinadi."}, status=status.HTTP_400_BAD_REQUEST)

        device = PrinterDevice.objects.filter(token=token, is_active=True).first()
        if not device:
            return Response({"detail": "Printer topilmadi."}, status=status.HTTP_404_NOT_FOUND)

        job_id = request.data.get('job_id')
        job_status = request.data.get('status', 'PRINTED')
        error_msg = request.data.get('error_message', '')

        job = PrintJob.objects.filter(id=job_id, club=device.club).first()
        if not job:
            return Response({"detail": "Print vazifasi topilmadi."}, status=status.HTTP_404_NOT_FOUND)

        job.status = job_status
        job.device = device
        job.error_message = error_msg
        if job_status == PrintJobStatus.PRINTED:
            job.printed_at = timezone.now()
        job.save(update_fields=['status', 'device', 'error_message', 'printed_at'])

        return Response({"status": "acknowledged", "job_id": str(job.id)})

class PrinterTestPrintView(APIView):
    """
    Saytdan turib kassa printeriga sinov chekini yuborish
    """
    permission_classes = [permissions.IsAuthenticated, IsClubStaff, HasActiveSubscription]

    def post(self, request, pk):
        device = get_object_or_404(PrinterDevice, id=pk)
        job = create_test_print_job(device)
        return Response({
            "status": "queued",
            "message": "Test chek navbatga qo'shildi. Printerga yuborilmoqda.",
            "job_id": str(job.id)
        }, status=status.HTTP_201_CREATED)
