import { useState, useEffect, useCallback } from "react";
import {
    Box,
    Card,
    Typography,
    Table,
    TableBody,
    TableContainer,
    TablePagination,
    TableRow,
    TableCell,
    CircularProgress,
} from "@mui/material";

import { DashboardContent } from "../../layouts/dashboard/main";
import { RevenueTableHead } from "./revenueTableHead";
import { RevenueTableRow } from "./revenueTableRow";
import { RevenueTableToolbar } from "./revenueTableToolbar";
import { RevenueStatsCards } from "./revenueStatsCards";
import { getTransactions } from "../../../services/transaction.service";
import { emptyRows } from "./revenueUtils";
import { RevenueDetailModal } from "./RevenueDetailModal";

// 🔥 Icons (optional but recommended)
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ReceiptIcon from "@mui/icons-material/Receipt";

// 🔥 Reuse your existing card component
import { UserAnalyticsCard } from "../user/UserAnalyticsCard";

export function RevenueView() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalItems, setTotalItems] = useState(0);
    const [pagination, setPagination] = useState(null);

    const [params, setParams] = useState({
        page: 1,
        limit: 10,
        sortBy: "createdAt",
        sortOrder: "desc",
        search: "",
        type: "",
        status: "",
        startDate: "",
        endDate: "",
    });

    const [stats, setStats] = useState({
        totalRevenue: 0,
        adminRevenue: 0,
        sellerRevenue: 0,
    });

    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [openModal, setOpenModal] = useState(false);

    const fetchTransactions = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getTransactions(params);
            if (res && res.success) {
                setData(res.data);
                setTotalItems(res.totalItems);
                setPagination(res.pagination);
                
                setStats(res.stats || {
                    totalRevenue: 0,
                    adminRevenue: 0,
                    sellerRevenue: 0,
                });
            }
        } catch (error) {
            console.error("Failed to fetch transactions", error);
        } finally {
            setLoading(false);
        }
    }, [params]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const handlePageChange = (event, newPage) => {
        setParams((prev) => ({ ...prev, page: newPage + 1 }));
    };

    const handleRowsPerPageChange = (event) => {
        setParams((prev) => ({ ...prev, page: 1, limit: parseInt(event.target.value, 10) }));
    };

    const handleParamsChange = (newParams) => {
        setParams((prev) => ({ ...prev, ...newParams, page: 1 }));
    };

    const handleViewDetails = (transaction) => {
        setSelectedTransaction(transaction);
        setOpenModal(true);
    };

    const handleCloseModal = () => {
        setOpenModal(false);
        setSelectedTransaction(null);
    };

    return (
        <DashboardContent>

            {/* 🔥 STATS CARDS */}
            <RevenueStatsCards stats={stats} totalOrders={totalItems} />

            {/* 🔥 SAME SPACING AS USERS PAGE */}
            <Box
                display="flex"
                justifyContent="space-between"
                mt={3}   // ✅ IMPORTANT spacing (same as users)
                mb={4}
            >
                <Typography variant="h4">Revenue Overview</Typography>
            </Box>

            {/* Calculations for Table */}
            {(() => {
                const currentPageMUI = params.page - 1;
                const rowsPerPage = params.limit;
                const calculatedEmptyRows = emptyRows(currentPageMUI, rowsPerPage, data.length);
                const columnCount = 12; // 10 headCells + checkbox + actions

                return (
                    <Card sx={{ minWidth: 900, boxShadow: "none" }}>
                        <RevenueTableToolbar
                            numSelected={0}
                            currentParams={params}
                            onParamsChange={handleParamsChange}
                        />

                        <TableContainer
                            sx={{ position: "relative", minHeight: 300, overflowX: "auto" }}
                        >
                            {loading && (
                                <Box
                                    sx={{
                                        position: "absolute",
                                        inset: 0,
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        bgcolor: "rgba(255,255,255,0.7)",
                                        zIndex: 10,
                                    }}
                                >
                                    <CircularProgress />
                                </Box>
                            )}

                            <Table size="medium" stickyHeader>
                                <RevenueTableHead />

                                <TableBody>
                                    {data.map((row) => (
                                        <RevenueTableRow 
                                            key={row._id} 
                                            order={row} 
                                            selected={false}
                                            onSelectRow={() => {}}
                                            onViewDetails={handleViewDetails}
                                        />
                                    ))}

                                    {calculatedEmptyRows > 0 && !loading && data.length > 0 && (
                                        <TableRow style={{ height: 53 * calculatedEmptyRows }}>
                                            <TableCell colSpan={columnCount} />
                                        </TableRow>
                                    )}

                                    {!loading && data.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={columnCount} align="center">
                                                <Typography sx={{ py: 3 }}>
                                                    No revenue data found.
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <TablePagination
                            component="div"
                            count={totalItems}
                            page={params.page - 1}
                            rowsPerPage={params.limit}
                            onPageChange={handlePageChange}
                            rowsPerPageOptions={[5, 10, 25, 50]}
                            onRowsPerPageChange={handleRowsPerPageChange}
                        />
                    </Card>
                );
            })()}

            <RevenueDetailModal 
                open={openModal} 
                onClose={handleCloseModal} 
                transaction={selectedTransaction} 
            />
        </DashboardContent>
    );
}